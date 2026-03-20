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

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new AppError("Invalid date range", 400);
  }

  return Attendance.find({
    user: userId,
    date: { $gte: fromDate, $lte: toDate },
  }).sort({ date: 1 });
};

// ================= PUNCH IN ================= */
export const punchInService = async (userId) => {
  const now = nowUTC();
  const user = await User.findById(userId).select("role").lean();

  // if (!isWithinOfficeHoursIST(now, user.role)) {
  //   throw new AppError("Punch in allowed between 08AM–07PM IST", 400);
  // }

  const date = todayISTUTC();

  const isHoliday = await Holiday.exists({ date });
  if (isHoliday) {
    throw new AppError("Punch-in not allowed on holidays", 400);
  }

  const existing = await WorkRecord.findOne({ user: userId, date });

  if (existing && existing.punchIn && !existing.punchOut) {
    throw new AppError("Already punched in", 400);
  }

  const record = await WorkRecord.findOneAndUpdate(
    { user: userId, date },
    { $setOnInsert: { punchIn: now } },
    { upsert: true, new: true },
  );

  return record;
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
      punchOut: { $exists: false },
    });
  }

  if (!record) {
    throw new AppError("Punch in first", 400);
  }

  const attendance = await Attendance.findOne({
    user: userId,
    date: record.date,
  });

  if (attendance?.status === "INCOMPLETE") {
    throw new AppError(
      "Attendance already auto-closed as INCOMPLETE. Contact HR.",
      403,
    );
  }

  record.punchOut = nowUTC();
  record.breaks.forEach((b) => !b.out && (b.out = record.punchOut));

  // calcWorkMinutes(record);
  // await record.save();

  calcWorkMinutes(record);

  const user = await User.findById(userId).lean();
  const policy = getWorkPolicy(user.role);

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
    user.role,
  );

  await record.save();

  /* ===== SYNC ATTENDANCE TABLE ===== */

  await Attendance.findOneAndUpdate(
    { user: userId, date: record.date },
    {
      status: record.attendanceStatus,
      source: "SYSTEM",
    },
    { upsert: true },
  );

  return record;
};

// ================ BREAK IN ================= */
export const breakInService = async (userId) => {
  const record = await WorkRecord.findOne({
    user: userId,
    date: todayISTUTC(),
  });

  if (!record || record.punchOut) {
    throw new AppError("No active session", 400);
  }

  const last = record.breaks.at(-1);
  if (last && !last.out) {
    throw new AppError("Already on break", 400);
  }

  record.breaks.push({ in: nowUTC() });
  return record.save();
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

  last.out = nowUTC();
  return record.save();
};

// ================= ALL EMPLOYEES ATTENDANCE ================= */
export const getAllEmployeesAttendanceService = async (date) => {
  if (!date) throw new AppError("Date is required", 400);

  const day = parseISTDateOnly(date);

  const [users, records, holiday] = await Promise.all([
    User.find({ role: { $ne: "admin" }, isActive: true })
      .select("name email role")
      .lean(),

    Attendance.find({ date: day }).lean(),

    Holiday.findOne({ date: day }),
  ]);

  const recordMap = new Map();
  records.forEach((r) => recordMap.set(String(r.user), r));

  // ROLE PRIORITY
  const priority = {
    hr: 1,
    employee: 2,
    intern: 3,
  };

  // SORT USERS
  users.sort(
    (a, b) =>
      (priority[a.role] || 99) - (priority[b.role] || 99) ||
      a.name.localeCompare(b.name),
  );

  return users.map((u) => {
    const att = recordMap.get(String(u._id));

    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: att ? att.status : holiday ? "HOLIDAY" : "ABSENT",
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

  const attendance = await Attendance.findOne({ user: userId, date: day });
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

  const [attendance, workRecords] = await Promise.all([
    Attendance.find({ date: { $gte: fromDate, $lte: toDate } })
      .sort({ date: 1 })
      .populate("user", "name email role")
      .lean(),

    WorkRecord.find({ date: { $gte: fromDate, $lte: toDate } })
      .sort({ date: 1 })
      .lean(),
  ]);

  const workMap = new Map();
  workRecords.forEach((w) => {
    workMap.set(`${w.user}_${w.date.getTime()}`, w);
  });

  const priority = {
    hr: 1,
    employee: 2,
    intern: 3,
  };
  console.log("NULL USERS:", attendance.filter((a) => !a.user).length);
  console.table(
    attendance
      .filter((a) => !a.user)
      .map((a) => ({
        _id: a._id,
        date: a.date,
        status: a.status,
      })),
  );
  return attendance
    .filter((a) => a.user) // ✅ MUST BE FIRST
    .sort(
      (a, b) =>
        (priority[a.user.role] || 99) - (priority[b.user.role] || 99) ||
        a.user.name.localeCompare(b.user.name),
    )
    .map((att) => {
      const key = `${att.user._id}_${att.date.getTime()}`;
      const work = workMap.get(key);

      return {
        userId: att.user._id,
        name: att.user.name,
        email: att.user.email,
        role: att.user.role,
        date: att.date,
        status: att.status,
        punchIn: work?.punchIn || null,
        punchOut: work?.punchOut || null,
      };
    });

  // return attendance
  //   .sort(
  //     (a, b) =>
  //       (priority[a.user.role] || 99) - (priority[b.user.role] || 99) ||
  //       a.user.name.localeCompare(b.user.name),
  //   )
  //   .map((att) => {
  //     const key = `${att.user._id}_${att.date.getTime()}`;
  //     const work = workMap.get(key);

  //     return {
  //       userId: att.user._id,
  //       name: att.user.name,
  //       email: att.user.email,
  //       role: att.user.role,
  //       date: att.date,
  //       status: att.status,
  //       punchIn: work?.punchIn || null,
  //       punchOut: work?.punchOut || null,
  //     };
  //   });
};

// ================= LIVE EMPLOYEES STATUS ================= */
export const getLiveEmployeesStatusByDateService = async (dateStr) => {
  const todayKey = toISTDateKey(new Date());
  const selectedKey = dateStr || todayKey;

  const mongoDate = parseIST(selectedKey);

  const [users, records] = await Promise.all([
    User.find({ role: { $ne: "admin" }, isActive: true })
      .select("name role")
      .lean(),
    WorkRecord.find({ date: mongoDate }).lean(),
  ]);

  // ROLE PRIORITY
  const priority = {
    hr: 1,
    employee: 2,
    intern: 3,
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

    if (!record) {
      return {
        userId: u._id,
        name: u.name,
        role: u.role,
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
      status,
      workedSeconds: calcLiveNetSeconds(record),
      breakSeconds: calcLiveBreakSeconds(record),
      punchIn: record.punchIn,
      punchOut: record.punchOut,
    };
  });
};
// ================= DAY ATTENDANCE ================= */
export const getDayAttendanceService = async (id) => {
  return Attendance.find({ id });
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
  });

  if (!record) {
    record = await WorkRecord.findOne({
      user: userId,
      date: yesterday,
      punchOut: { $exists: false },
    });
  }

  if (!record) return null;

  const lastBreak = record.breaks.at(-1);
  const onBreak = lastBreak && !lastBreak.out;

  return {
    ...record.toObject(),
    liveNetSeconds: calcLiveNetSeconds(record),
    serverNow: new Date(),
    isRunning: !!record.punchIn && !record.punchOut && !onBreak,
    onBreak,
  };
};

// ================ GET WEEKLY PROGRESS ================= */
export const getWeeklyProgressService = async (userId) => {
  const { weekStartUTC, weekEndUTC } = getCurrentWeekRangeIST();

  const records = await WorkRecord.find({
    user: userId,
    date: { $gte: weekStartUTC, $lte: weekEndUTC },
  });

  let totalSeconds = 0;

  for (const record of records) {
    if (!record.punchIn) continue;

    const endTime = record.punchOut ?? new Date();
    const workedSeconds = Math.floor((endTime - record.punchIn) / 1000);

    totalSeconds += workedSeconds;
  }

  // ===== HOLIDAY ADJUSTMENT =====
  const holidays = await Holiday.find({
    date: { $gte: weekStartUTC, $lte: weekEndUTC },
  });

  let holidayCount = 0;

  for (const h of holidays) {
    const day = new Date(h.date).getUTCDay();

    if (day !== 0 && day !== 6) {
      holidayCount++;
    }
  }

  // ===== LEAVE ADJUSTMENT =====
  const leaves = await Leave.find({
    user: userId,
    status: "APPROVED",
    $or: [
      {
        fromDate: { $lte: weekEndUTC },
        toDate: { $gte: weekStartUTC },
      },
    ],
  });

  let leaveDays = 0;

  for (const leave of leaves) {
    let current = new Date(
      Math.max(leave.fromDate.getTime(), weekStartUTC.getTime()),
    );

    const end = new Date(
      Math.min(leave.toDate.getTime(), weekEndUTC.getTime()),
    );

    while (current <= end) {
      const day = current.getUTCDay();

      // Skip weekends
      if (day !== 0 && day !== 6) {
        if (leave.isHalfDay) {
          leaveDays += 0.5;
        } else {
          leaveDays += 1;
        }
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  const user = await User.findById(userId).lean();

  const policy = getWorkPolicy(user?.role || "employee");

  const totalAdjustedDays = holidayCount + leaveDays;

  const requiredSeconds = Math.max(
    (policy.weeklyHours - totalAdjustedDays * policy.dailyHours) * 3600,
    0,
  );

  // ===== STATUS LOGIC =====
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
    { upsert: true, new: true },
  );

  return {
    ...weeklyDoc.toObject(),
    totalSeconds,

    dailyRequiredSeconds: (policy.dailyHours - 1) * 3600,

    percentage: Math.min((totalSeconds / requiredSeconds) * 100, 100),
    remainingMinutes: Math.max((requiredSeconds - totalSeconds) / 60, 0),
    holidayCount,
  };
};

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
    hr: 1,
    employee: 2,
    intern: 3,
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
