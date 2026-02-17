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
} from "./attendance.utils.js";

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

  if (!isWithinOfficeHoursIST(now)) {
    throw new AppError("Punch in allowed between 08AM–07PM IST", 400);
  }

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

  calcWorkMinutes(record);
  await record.save();

  await Attendance.findOneAndUpdate(
    { user: userId, date: record.date },
    {
      status: suggestAttendanceStatus(record.netWorkMinutes),
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
    User.find({ role: { $ne: "admin" }, isActive: true }).lean(),
    Attendance.find({ date: day }).lean(),
    Holiday.findOne({ date: day }),
  ]);

  const recordMap = new Map();
  records.forEach((r) => recordMap.set(String(r.user), r));

  return users.map((u) => {
    const att = recordMap.get(String(u._id));
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
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

  // const approvedLeave = await Leave.findOne({
  //   user: userId,
  //   status: "APPROVED",
  //   fromDate: { $lte: day },
  //   toDate: { $gte: day },
  // });

  // if (approvedLeave && status !== "LEAVE") {
  //   throw new AppError(
  //     "Employee is on approved leave. Cancel leave before marking attendance.",
  //     409,
  //   );
  // }

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
      .populate("user", "name email")
      .lean(),
    WorkRecord.find({ date: { $gte: fromDate, $lte: toDate } })
      .sort({ date: 1 })
      .lean(),
  ]);

  const workMap = new Map();
  workRecords.forEach((w) => {
    workMap.set(`${w.user}_${w.date.getTime()}`, w);
  });

  return attendance.map((att) => {
    const key = `${att.user._id}_${att.date.getTime()}`;
    const work = workMap.get(key);

    return {
      userId: att.user._id,
      name: att.user.name,
      email: att.user.email,
      date: att.date,
      status: att.status,
      punchIn: work?.punchIn || null,
      punchOut: work?.punchOut || null,
    };
  });
};

// ================= LIVE EMPLOYEES STATUS ================= */
export const getLiveEmployeesStatusByDateService = async (dateStr) => {
  const todayKey = toISTDateKey(new Date());
  const selectedKey = dateStr || todayKey;
  const isToday = selectedKey === todayKey;

  const mongoDate = parseIST(selectedKey);

  const [users, records] = await Promise.all([
    User.find({ role: { $ne: "admin" }, isActive: true }).lean(),
    WorkRecord.find({ date: mongoDate }).lean(),
  ]);

  const recordMap = new Map();
  records.forEach((r) => recordMap.set(String(r.user), r));

  return users.map((u) => {
    const record = recordMap.get(String(u._id));

    if (!record) {
      return {
        userId: u._id,
        name: u.name,
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
    if (record.punchOut) {
      totalSeconds += (record.netWorkMinutes || 0) * 60;
    } else {
      totalSeconds += calcLiveNetSeconds(record);
    }
  }
  const requiredSeconds = 48 * 60 * 60;

  const percentage = Math.min((totalSeconds / requiredSeconds) * 100, 100);

  const totalMinutes = Math.floor(totalSeconds / 60);

  const weeklyDoc = await weeklyWork.findOneAndUpdate(
    { user: userId, weekStart: weekStartUTC },
    {
      weekEnd: weekEndUTC,
      totalMinutes,
      requiredMinutes: 48 * 60,
      status: totalSeconds >= requiredSeconds ? "COMPLETED" : "IN_PROGRESS",
    },
    { upsert: true, new: true },
  );

  return {
    ...weeklyDoc.toObject(),
    totalSeconds,
    percentage,
    remainingMinutes: Math.max((requiredSeconds - totalSeconds) / 60, 0),
  };
};
