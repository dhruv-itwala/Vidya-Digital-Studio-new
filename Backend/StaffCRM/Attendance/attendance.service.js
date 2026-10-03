// Backend/StaffCRM/Attendance/attendance.service.js
import Attendance from "./attendance.model.js";
import WorkRecord from "./workRecord.model.js";
import weeklyWork from "./weeklyWork.model.js";

import {
  nowUTC,
  todayISTUTC,
  parseISTDateOnly,
  calcWorkMinutes,
  suggestAttendanceStatus,
  isWithinOfficeHoursIST,
  calcLiveNetSeconds,
  calcLiveBreakSeconds,
  getCurrentWeekRangeIST,
  getWorkPolicy,
} from "./utils/attendance.utils.js";

import User from "../Users/user.model.js";
import Holiday from "../Holidays/holiday.model.js";
import Leave from "../Leaves/leave.model.js";

import { parseIST, toISTDateKey } from "../utils/date.utils.js";
import AppError from "../utils/AppError.js";

// ================= MY ATTENDANCE ================= */
export const getMyAttendanceService = async (userId, from, to) => {
  if (!from || !to) {
    throw new AppError("from and to are required", 400);
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const nowDay = todayISTUTC();

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new AppError("Invalid date range", 400);
  }

  const [attendances, holidays, leaves] = await Promise.all([
    Attendance.find({
      user: userId,
      date: { $gte: fromDate, $lte: toDate },
    }).lean(),
    Holiday.find({ date: { $gte: fromDate, $lte: toDate } }).lean(),
    Leave.find({
      user: userId,
      status: "APPROVED",
      fromDate: { $lte: toDate },
      toDate: { $gte: fromDate },
    }).lean(),
  ]);

  const attMap = new Map();
  attendances.forEach((a) => attMap.set(a.date.getTime(), a));

  const holMap = new Map();
  holidays.forEach((h) => holMap.set(h.date.getTime(), h));

  const records = [];
  let current = new Date(fromDate);
  
  while (current <= toDate) {
    const time = current.getTime();
    let status = null;
    let remarks = null;
    
    if (attMap.has(time)) {
      status = attMap.get(time).status;
      remarks = attMap.get(time).remarks || "";
    } else {
      const isHol = holMap.has(time) || new Date(time + 5.5 * 60 * 60 * 1000).getUTCDay() === 0;
      const isLeave = leaves.some(l => current >= l.fromDate && current <= l.toDate);
      
      if (current > nowDay) {
        if (isHol) status = "HOLIDAY";
        else if (isLeave) status = "LEAVE";
      } else {
        if (isHol) status = "HOLIDAY";
        else if (isLeave) status = "LEAVE";
        else status = "ABSENT";
      }
    }
    
    if (status) {
      records.push({
        date: new Date(current),
        status,
        remarks,
      });
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return records;
};

// ================= PUNCH IN ================= */
export const punchInService = async (userId) => {
  const now = nowUTC();
  const date = todayISTUTC();
  const [user, isHoliday, existing] = await Promise.all([
    User.findById(userId).select("role").lean(),
    Holiday.exists({ date }),
    WorkRecord.findOne({ user: userId, date }),
  ]);

  if (isHoliday) {
    throw new AppError("Today is a holiday", 400);
  }

  // If already punched in and NOT punched out, cannot punch in again
  if (existing && existing.punchIn && !existing.punchOut) {
    throw new AppError("Already punched in", 400);
  }

  let punches = [];
  let punchIn = now;

  if (existing) {
    punchIn = existing.punchIn || now;
    if (Array.isArray(existing.punches) && existing.punches.length > 0) {
      punches = existing.punches.map((p) => ({
        in: p.in,
        out: p.out,
      }));
    } else if (existing.punchIn) {
      punches = [{ in: existing.punchIn, out: existing.punchOut || now }];
    }
  }

  punches.push({ in: now, out: null });

  const record = await WorkRecord.findOneAndUpdate(
    { user: userId, date },
    {
      $set: {
        punchIn,
        punches,
        punchOutReminderSent: false,
      },
      $unset: { punchOut: 1 },
    },
    { upsert: true, new: true, lean: true },
  );

  return {
    ...record,
    liveNetSeconds: calcLiveNetSeconds(record, now),
    serverNow: now,
    isRunning: true,
    onBreak: false,
  };
};

// ================= PUNCH OUT ================= */
export const punchOutService = async (userId) => {
  const today = todayISTUTC();
  const yesterday = new Date(today.getTime() - 86400000);

  let record = await WorkRecord.findOne({ user: userId, date: today });

  if (!record) {
    record = await WorkRecord.findOne({
      user: userId,
      date: yesterday,
      punchIn: { $exists: true },
      $or: [{ punchOut: { $exists: false } }, { punchOut: null }],
    });
  }

  if (!record || !record.punchIn) {
    throw new AppError("Punch in first", 400);
  }

  if (record.punchOut) {
    throw new AppError("Already punched out", 400);
  }

  const [attendance, user] = await Promise.all([
    Attendance.findOne({
      user: userId,
      date: record.date,
    }),
    User.findById(userId).select("role").lean(),
  ]);

  if (attendance?.status === "INCOMPLETE") {
    throw new AppError(
      "Attendance already auto-closed as INCOMPLETE. Contact HR.",
      403,
    );
  }

  const now = nowUTC();
  record.punchOut = now;
  record.breaks.forEach((b) => !b.out && (b.out = record.punchOut));

  if (!record.punches || record.punches.length === 0) {
    record.punches = [{ in: record.punchIn, out: now }];
  } else {
    const lastPunch = record.punches.at(-1);
    if (lastPunch && !lastPunch.out) {
      lastPunch.out = now;
    } else {
      record.punches.push({ in: record.punchIn, out: now });
    }
  }

  calcWorkMinutes(record);
  const policy = getWorkPolicy(user?.role || "employee");

  /* ===== LATE CALCULATION ===== */
  const shiftStart = new Date(record.date);
  shiftStart.setUTCHours(policy.officeHours.start - 5, 30, 0, 0);

  if (record.punchIn > shiftStart) {
    record.lateMinutes = Math.floor((record.punchIn - shiftStart) / 60000);
  }

  /* ===== OVERTIME ===== */
  const requiredMinutes = policy.dailyHours * 60;
  if (record.netWorkMinutes > requiredMinutes) {
    record.overtimeMinutes = record.netWorkMinutes - requiredMinutes;
  }

  /* ===== ATTENDANCE STATUS ===== */
  record.attendanceStatus = suggestAttendanceStatus(
    record.netWorkMinutes,
    user?.role || "employee",
  );

  /* ===== SYNC ATTENDANCE TABLE & SAVE IN PARALLEL ===== */
  await Promise.all([
    record.save(),
    Attendance.findOneAndUpdate(
      { user: userId, date: record.date },
      {
        status: record.attendanceStatus,
        source: "SYSTEM",
      },
      { upsert: true },
    ),
  ]);

  const raw = record.toObject ? record.toObject() : record;
  return {
    ...raw,
    liveNetSeconds: calcLiveNetSeconds(raw, now),
    serverNow: now,
    isRunning: false,
    onBreak: false,
  };
};

// ================ BREAK IN ================= */
export const breakInService = async (userId) => {
  const record = await WorkRecord.findOne({
    user: userId,
    date: todayISTUTC(),
  });

  if (!record || !record.punchIn || record.punchOut) {
    throw new AppError("No active session", 400);
  }

  const last = record.breaks.at(-1);
  if (last && !last.out) {
    throw new AppError("Already on break", 400);
  }

  const now = nowUTC();
  record.breaks.push({ in: now });
  await record.save();

  const raw = record.toObject ? record.toObject() : record;
  return {
    ...raw,
    liveNetSeconds: calcLiveNetSeconds(raw),
    serverNow: now,
    isRunning: false,
    onBreak: true,
  };
};

// ================ BREAK OUT ================= */
export const breakOutService = async (userId) => {
  const record = await WorkRecord.findOne({
    user: userId,
    date: todayISTUTC(),
  });

  const last = record?.breaks.at(-1);
  if (!last || last.out) {
    throw new AppError("No active break", 400);
  }

  const now = nowUTC();
  last.out = now;
  await record.save();

  const raw = record.toObject ? record.toObject() : record;
  return {
    ...raw,
    liveNetSeconds: calcLiveNetSeconds(raw),
    serverNow: now,
    isRunning: true,
    onBreak: false,
  };
};

// ================= ALL EMPLOYEES ATTENDANCE ================= */
export const getAllEmployeesAttendanceService = async (date) => {
  if (!date) throw new AppError("Date is required", 400);

  const day = parseISTDateOnly(date);
  const nowDay = todayISTUTC();

  const [users, records, holiday, leaves] = await Promise.all([
    User.find({ isActive: true })
      .select("name email role")
      .lean(),
    Attendance.find({ date: day }).lean(),
    Holiday.findOne({ date: day }).lean(),
    Leave.find({ status: "APPROVED", fromDate: { $lte: day }, toDate: { $gte: day } }).lean(),
  ]);

  const recordMap = new Map();
  records.forEach((r) => recordMap.set(String(r.user), r));

  const priority = { admin: 1, hr: 2, employee: 3, intern: 4 };

  users.sort(
    (a, b) =>
      (priority[a.role] || 99) - (priority[b.role] || 99) ||
      a.name.localeCompare(b.name),
  );

  return users.map((u) => {
    const att = recordMap.get(String(u._id));
    let status = null;

    if (att) {
      status = att.status;
    } else {
      const isHol = holiday || new Date(day.getTime() + 5.5 * 60 * 60 * 1000).getUTCDay() === 0;
      const isLeave = leaves.some(l => String(l.user) === String(u._id));
      
      if (day > nowDay) {
        if (isHol) status = "HOLIDAY";
        else if (isLeave) status = "LEAVE";
      } else {
        if (isHol) status = "HOLIDAY";
        else if (isLeave) status = "LEAVE";
        else status = "ABSENT";
      }
    }

    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: status || "ABSENT", // Fallback
    };
  });
};

// ================= MARK ATTENDANCE STATUS ================= */
export const markAttendanceStatusService = async (userId, date, status) => {
  const allowed = ["PRESENT", "HALF_DAY", "WFH", "ABSENT", "HOLIDAY", "LEAVE"];
  if (!allowed.includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const day = parseISTDateOnly(date);

  const approvedLeave = await Leave.findOne({
    user: userId,
    status: "APPROVED",
    fromDate: { $lte: day },
    toDate: { $gte: day },
  });

  if (approvedLeave) {
    // FULL DAY LEAVE
    if (!approvedLeave.isHalfDay && status !== "LEAVE") {
      throw new AppError(
        "Employee is on full day approved leave. Cancel leave before marking attendance.",
        409,
      );
    }

    // HALF DAY LEAVE
    if (approvedLeave.isHalfDay) {
      const allowedHalfDayStatuses = ["HALF_DAY", "PRESENT", "WFH"];

      if (!allowedHalfDayStatuses.includes(status)) {
        throw new AppError(
          "Only HALF_DAY / PRESENT / WFH allowed for half-day leave.",
          409,
        );
      }
    }
  }

  const isHoliday = await Holiday.exists({ date: day });
  if (isHoliday && status !== "HOLIDAY") {
    throw new AppError(
      "This day is a holiday. Attendance cannot be changed.",
      403,
    );
  }

  return Attendance.findOneAndUpdate(
    { user: userId, date: day },
    { status, source: "HR" },
    { upsert: true, new: true },
  );
};

// ================= ATTENDANCE BY DATE ================= */
export const getUserAttendanceByDateService = async (userId, date) => {
  const day = parseISTDateOnly(date);

  const attendance = await Attendance.findOne({ user: userId, date: day }).lean();
  if (attendance) return attendance;

  const isHoliday = await Holiday.exists({ date: day });

  return {
    user: userId,
    date: day,
    status: isHoliday ? "HOLIDAY" : "ABSENT",
    source: "SYSTEM",
  };
};

// ================= ATTENDANCE BY DATE RANGE ================= */
export const getAllAttendanceByDateRangeService = async (from, to) => {
  const fromDate = parseISTDateOnly(from);
  const toDate = parseISTDateOnly(to);
  const nowDay = todayISTUTC();

  const [users, attendance, workRecords, holidays, leaves] = await Promise.all([
    User.find({ isActive: true }).select("name email role").lean(),
    Attendance.find({ date: { $gte: fromDate, $lte: toDate } }).lean(),
    WorkRecord.find({ date: { $gte: fromDate, $lte: toDate } }).lean(),
    Holiday.find({ date: { $gte: fromDate, $lte: toDate } }).lean(),
    Leave.find({ status: "APPROVED", fromDate: { $lte: toDate }, toDate: { $gte: fromDate } }).lean(),
  ]);

  const attMap = new Map();
  attendance.forEach((a) => {
    attMap.set(`${a.user}_${a.date.getTime()}`, a);
  });

  const workMap = new Map();
  workRecords.forEach((w) => {
    workMap.set(`${w.user}_${w.date.getTime()}`, w);
  });
  
  const holMap = new Map();
  holidays.forEach((h) => {
    holMap.set(h.date.getTime(), h);
  });

  const priority = { admin: 1, hr: 2, employee: 3, intern: 4 };
  users.sort((a, b) => (priority[a.role] || 99) - (priority[b.role] || 99) || a.name.localeCompare(b.name));

  const results = [];
  let current = new Date(fromDate);
  
  while (current <= toDate) {
    const time = current.getTime();
    const isHol = holMap.has(time) || new Date(time + 5.5 * 60 * 60 * 1000).getUTCDay() === 0;
    
    for (const u of users) {
      const key = `${u._id}_${time}`;
      const att = attMap.get(key);
      const work = workMap.get(key);
      
      let status = null;
      if (att) {
        status = att.status;
      } else {
        const matchingLeave = leaves.find(l => String(l.user) === String(u._id) && current >= l.fromDate && current <= l.toDate);
        if (current > nowDay) {
          if (isHol) status = "HOLIDAY";
          else if (matchingLeave) {
            status = matchingLeave.type === "UNPAID" ? "ABSENT" : "LEAVE";
          }
        } else {
          if (isHol) status = "HOLIDAY";
          else {
            status = matchingLeave ? (matchingLeave.type === "UNPAID" ? "ABSENT" : "LEAVE") : "ABSENT";
          }
        }
      }

      if (status) {
        results.push({
          userId: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          date: new Date(current),
          status,
          punchIn: work?.punchIn || null,
          punchOut: work?.punchOut || null,
          punches: work?.punches || [],
        });
      }
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return results;
};

// ================= LIVE EMPLOYEES STATUS ================= */
export const getLiveEmployeesStatusByDateService = async (dateStr) => {
  const todayKey = toISTDateKey(new Date());
  const selectedKey = dateStr || todayKey;

  const mongoDate = parseIST(selectedKey);

  const [users, records] = await Promise.all([
    User.find({ isActive: true })
      .select("name role profilePicture")
      .lean(),
    WorkRecord.find({ date: mongoDate }).lean(),
  ]);

  // ROLE PRIORITY
  const priority = {
    admin: 1,
    hr: 2,
    employee: 3,
    intern: 4,
  };

  // SORT USERS
  users.sort(
    (a, b) =>
      (priority[a.role] || 99) - (priority[b.role] || 99) ||
      a.name.localeCompare(b.name),
  );

  const recordMap = new Map();
  records.forEach((r) => recordMap.set(String(r.user), r));

  return users.map((u) => {
    const record = recordMap.get(String(u._id));

    if (!record || !record.punchIn) {
      return {
        userId: u._id,
        name: u.name,
        role: u.role,
        profilePicture: u.profilePicture,
        status: "NOT_STARTED",
        workedSeconds: 0,
        breakSeconds: 0,
      };
    }

    const lastBreak = record.breaks?.at(-1);
    const onBreak = lastBreak && !lastBreak.out;

    let status = "WORKING";
    if (record.punchOut) status = "COMPLETED";
    else if (onBreak) status = "ON_BREAK";

    return {
      userId: u._id,
      name: u.name,
      role: u.role,
      profilePicture: u.profilePicture,
      status,
      workedSeconds: calcLiveNetSeconds(record),
      breakSeconds: calcLiveBreakSeconds(record),
      punchIn: record.punchIn,
      punchOut: record.punchOut,
      punches: record.punches || [],
    };
  });
};

// ================= DAY ATTENDANCE ================= */
export const getDayAttendanceService = async (id) => {
  return Attendance.find({ id }).lean();
};

// ================ DELETE ATTENDANCE BY ID ================= */
export const deleteAttendanceByIdService = async (attendanceId) => {
  return Attendance.findByIdAndDelete(attendanceId);
};

// ================ GET TODAY WORK RECORD ================= */
export const getTodayWorkRecordService = async (userId) => {
  const today = todayISTUTC();
  const yesterday = new Date(today.getTime() - 86400000);

  let record = await WorkRecord.findOne({
    user: userId,
    date: today,
  }).lean();

  if (!record) {
    record = await WorkRecord.findOne({
      user: userId,
      date: yesterday,
      punchIn: { $exists: true },
      $or: [{ punchOut: { $exists: false } }, { punchOut: null }],
    }).lean();
  }

  if (!record) return null;

  const lastBreak = record.breaks?.at(-1);
  const onBreak = lastBreak && !lastBreak.out;

  return {
    ...record,
    liveNetSeconds: calcLiveNetSeconds(record),
    serverNow: new Date(),
    isRunning: !!record.punchIn && !record.punchOut && !onBreak,
    onBreak,
  };
};

export const getWeeklyProgressService = async (userId) => {
  const { weekStartUTC, weekEndUTC } = getCurrentWeekRangeIST();

  const [user, records, holidays, attendance] = await Promise.all([
    User.findById(userId).select("role").lean(),
    WorkRecord.find({
      user: userId,
      date: { $gte: weekStartUTC, $lte: weekEndUTC },
    }).lean(),
    Holiday.find({
      date: { $gte: weekStartUTC, $lte: weekEndUTC },
    }).lean(),
    Attendance.find({
      user: userId,
      date: { $gte: weekStartUTC, $lte: weekEndUTC },
    }).lean(),
  ]);

  const policy = getWorkPolicy(user?.role || "employee");

  let totalSeconds = 0;
  for (const record of records) {
    if (!record.punchIn) continue;
    totalSeconds += calcLiveNetSeconds(record, new Date());
  }

  const getISTDay = (date) => {
    return new Date(new Date(date).getTime() + 5.5 * 60 * 60 * 1000).getUTCDay();
  };

  let holidayCount = 0;
  for (const h of holidays) {
    const day = getISTDay(h.date);
    if (day !== 0 && day !== 6) {
      holidayCount++;
    }
  }

  let leaveHours = 0;
  for (const att of attendance) {
    const day = getISTDay(att.date);
    if (day === 0 || day === 6) continue;

    if (att.status === "LEAVE") {
      leaveHours += policy.dailyHours;
    } else if (att.status === "HALF_DAY") {
      leaveHours += policy.dailyHours / 2;
    }
  }

  const requiredSeconds = Math.max(
    policy.weeklyHours * 3600 -
      leaveHours * 3600 -
      holidayCount * policy.dailyHours * 3600,
    0,
  );

  const now = new Date();
  const weekFinished = now > weekEndUTC;

  let status = "IN_PROGRESS";
  if (totalSeconds >= requiredSeconds) {
    status = "COMPLETED";
  } else if (weekFinished) {
    status = "DEFICIT";
  }

  const totalMinutes = Math.floor(totalSeconds / 60);

  const weeklyDoc = await weeklyWork.findOneAndUpdate(
    { user: userId, weekStart: weekStartUTC },
    {
      weekEnd: weekEndUTC,
      totalMinutes,
      requiredMinutes: requiredSeconds / 60,
      status,
    },
    { upsert: true, new: true, lean: true },
  );

  return {
    ...weeklyDoc,
    totalSeconds,
    dailyRequiredSeconds: (policy.dailyHours - 1) * 3600,
    percentage: Math.min((totalSeconds / (requiredSeconds || 1)) * 100, 100),
    remainingMinutes: Math.max((requiredSeconds - totalSeconds) / 60, 0),
    holidayCount,
  };
};

// =============== GET ALL USERS WEEKLY PROGRESS ================= */
export const getAllUsersWeeklyProgressService = async (weekStart) => {
  if (!weekStart) {
    throw new Error("weekStart is required");
  }

  const weekStartDate = parseISTDateOnly(weekStart);

  const progress = await weeklyWork
    .find({
      weekStart: weekStartDate,
    })
    .populate("user", "name email role")
    .lean();

  const priority = {
    admin: 1,
    hr: 2,
    employee: 3,
    intern: 4,
  };

  return progress
    .sort(
      (a, b) =>
        (priority[a.user.role] || 99) - (priority[b.user.role] || 99) ||
        a.user.name.localeCompare(b.user.name),
    )
    .map((p) => ({
      userId: p.user._id,
      name: p.user.name,
      email: p.user.email,
      role: p.user.role,
      weekStart: p.weekStart,
      weekEnd: p.weekEnd,
      totalMinutes: p.totalMinutes,
      requiredMinutes: p.requiredMinutes,
      status: p.status,
      percentage: Math.min((p.totalMinutes / p.requiredMinutes) * 100, 100),
      remainingMinutes: Math.max(p.requiredMinutes - p.totalMinutes, 0),
    }));
};

// ================ HR OVERRIDE ATTENDANCE ================= */
export const hrOverrideAttendanceService = async ({
  userId,
  date,
  punchIn,
  punchOut,
  breaks = [],
  punches = [],
  status,
}) => {
  const day = parseISTDateOnly(date);

  const [user, record] = await Promise.all([
    User.findById(userId),
    WorkRecord.findOne({ user: userId, date: day }),
  ]);
  
  if (!user) throw new AppError("User not found", 404);

  let targetRecord = record;

  if (!targetRecord) {
    targetRecord = new WorkRecord({ user: userId, date: day });
  }

  // APPLY OVERRIDES
  if (punchIn) targetRecord.punchIn = new Date(punchIn);
  if (punchOut) targetRecord.punchOut = new Date(punchOut);

  if (punches && punches.length) {
    targetRecord.punches = punches.map((p) => ({
      in: new Date(p.in),
      out: p.out ? new Date(p.out) : null,
    }));
    if (!punchIn && targetRecord.punches[0]?.in) {
      targetRecord.punchIn = targetRecord.punches[0].in;
    }
    if (!punchOut && targetRecord.punches.at(-1)?.out) {
      targetRecord.punchOut = targetRecord.punches.at(-1).out;
    }
  } else if (targetRecord.punchIn && targetRecord.punchOut) {
    targetRecord.punches = [
      { in: targetRecord.punchIn, out: targetRecord.punchOut },
    ];
  }

  if (breaks.length) {
    targetRecord.breaks = breaks.map((b) => ({
      in: new Date(b.in),
      out: b.out ? new Date(b.out) : null,
    }));
  }

  /* ======================
     AUTO CLOSE BREAKS
  ====================== */

  targetRecord.breaks.forEach((b) => {
    if (!b.out && targetRecord.punchOut) {
      b.out = targetRecord.punchOut;
    }
  });

  /* ======================
     RECALCULATE
  ====================== */

  calcWorkMinutes(targetRecord);

  const policy = getWorkPolicy(user.role);

  // Late
  const shiftStart = new Date(targetRecord.date);
  shiftStart.setUTCHours(policy.officeHours.start - 5, 30, 0, 0);

  targetRecord.lateMinutes =
    targetRecord.punchIn && targetRecord.punchIn > shiftStart
      ? Math.floor((targetRecord.punchIn - shiftStart) / 60000)
      : 0;

  // Overtime
  const requiredMinutes = policy.dailyHours * 60;
  targetRecord.overtimeMinutes =
    targetRecord.netWorkMinutes > requiredMinutes
      ? targetRecord.netWorkMinutes - requiredMinutes
      : 0;

  // Status
  targetRecord.attendanceStatus =
    status || suggestAttendanceStatus(targetRecord.netWorkMinutes, user.role);

  targetRecord.autoClosed = false; // HR fixed it

  await targetRecord.save();

  /* ======================
     SYNC ATTENDANCE
  ====================== */

  await Attendance.findOneAndUpdate(
    { user: userId, date: day },
    {
      status: targetRecord.attendanceStatus,
      source: "HR",
    },
    { upsert: true },
  );

  /* ======================
     SYNC WEEKLY
  ====================== */

  await getWeeklyProgressService(userId);

  return targetRecord;
};

// ================ GET WORK RECORD BY DATE ================= */
export const getWorkRecordByDateService = async (userId, date) => {
  const day = parseISTDateOnly(date);

  return WorkRecord.findOne({ user: userId, date: day }).lean();
};
