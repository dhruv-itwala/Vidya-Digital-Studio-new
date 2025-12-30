// Backend/Attendance/attendance.service.js
import Attendance from "./attendance.model.js";
import WorkRecord from "./workRecord.model.js";
import {
  nowUTC,
  todayISTUTC,
  parseISTDateOnly,
  calcWorkMinutes,
  suggestAttendanceStatus,
  calcLiveNetSeconds,
  isWithinOfficeHoursIST,
} from "./attendance.utils.js";
import userModel from "../Users/user.model.js";
import holidayModel from "../Holidays/holiday.model.js";
import attendanceModel from "./attendance.model.js";
import workRecordModel from "./workRecord.model.js";
import leaveModel from "../Leaves/leave.model.js";

/* ========== EMPLOYEE ========== */

export const getMyAttendanceService = async (userId, from, to) => {
  const fromDate = parseISTDateOnly(from);
  const toDate = parseISTDateOnly(to);

  return attendanceModel
    .find({ user: userId, date: { $gte: fromDate, $lte: toDate } })
    .sort({ date: 1 });
};

// export const getTodayWorkRecordService = async (userId) => {
//   return workRecordModel.findOne({
//     user: userId,
//     date: todayISTUTC(),
//   });
// };

export const punchInService = async (userId) => {
  const now = nowUTC();
  if (!isWithinOfficeHoursIST(now))
    throw new Error("Punch in allowed between 10AM–7PM IST");

  const date = todayISTUTC();

  const isHoliday = await holidayModel.exists({ date });
  if (isHoliday) {
    throw new Error("Punch-in not allowed on holidays");
  }

  const record = await WorkRecord.findOneAndUpdate(
    { user: userId, date },
    { $setOnInsert: { punchIn: now } },
    { upsert: true, new: true }
  );

  if (record.punchIn && record.punchOut) throw new Error("Already punched out");

  return record;
};

export const punchOutService = async (userId) => {
  const date = todayISTUTC();
  const record = await WorkRecord.findOne({ user: userId, date });

  if (!record || record.punchOut) throw new Error("Punch in first");

  record.punchOut = nowUTC();
  record.breaks.forEach((b) => !b.out && (b.out = record.punchOut));
  calcWorkMinutes(record);

  await record.save();

  // Auto suggest attendance
  await Attendance.findOneAndUpdate(
    { user: userId, date },
    {
      status: suggestAttendanceStatus(record.netWorkMinutes),
      source: "SYSTEM",
    },
    { upsert: true }
  );

  return record;
};

export const breakInService = async (userId) => {
  const record = await WorkRecord.findOne({
    user: userId,
    date: todayISTUTC(),
  });
  if (!record || record.punchOut) throw new Error("No active session");

  const last = record.breaks.at(-1);
  if (last && !last.out) throw new Error("Already on break");

  record.breaks.push({ in: nowUTC() });
  return record.save();
};

export const breakOutService = async (userId) => {
  const record = await WorkRecord.findOne({
    user: userId,
    date: todayISTUTC(),
  });
  const last = record?.breaks.at(-1);
  if (!last || last.out) throw new Error("No active break");

  last.out = nowUTC();
  return record.save();
};

/* ========== HR / ADMIN ========== */

export const getAllEmployeesAttendanceService = async (date) => {
  const day = parseISTDateOnly(date);
  const users = await userModel.find({ role: { $ne: "admin" } });
  const records = await Attendance.find({ date: day });
  const holiday = await holidayModel.findOne({ date: day });

  return users.map((u) => {
    const att = records.find((r) => r.user.equals(u._id));
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      status: att ? att.status : holiday ? "HOLIDAY" : "ABSENT",
    };
  });
};

export const markAttendanceStatusService = async (userId, date, status) => {
  if (
    !["PRESENT", "HALF_DAY", "WFH", "ABSENT", "HOLIDAY", "LEAVE"].includes(
      status
    )
  ) {
    throw new Error("Invalid status");
  }

  const day = parseISTDateOnly(date);

  // 🔒 1️⃣ CHECK APPROVED LEAVE
  const approvedLeave = await leaveModel.findOne({
    user: userId,
    status: "APPROVED",
    fromDate: { $lte: day },
    toDate: { $gte: day },
  });

  if (approvedLeave && status !== "LEAVE") {
    throw new Error(
      "Employee is on approved leave. Please decline or cancel the leave before marking attendance."
    );
  }

  // 🔒 2️⃣ CHECK HOLIDAY LOCK
  const isHoliday = await holidayModel.exists({ date: day });
  if (isHoliday && status !== "HOLIDAY") {
    throw new Error("This day is a holiday. Attendance cannot be changed.");
  }

  // Find existing or create new attendance
  const attendance = await attendanceModel.findOneAndUpdate(
    { user: userId, date: day },
    { status },
    { upsert: true, new: true }
  );

  return attendance;
};

export const getUserAttendanceByDateService = async (userId, date) => {
  // Convert input date to start/end of day in IST
  const startOfDay = parseISTDateOnly(date); // 2025-12-21T00:00:00+05:30
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1); // next day start

  return attendanceModel.findOne({
    user: userId,
    date: { $gte: startOfDay, $lt: endOfDay }, // range query
  });
};
// export const getAllAttendanceByDateRangeService = async (from, to) => {
//   const fromDate = parseISTDateOnly(from);
//   const toDate = parseISTDateOnly(to);

//   return attendanceModel
//     .find({ date: { $gte: fromDate, $lte: toDate } })
//     .populate("user")
//     .sort({ date: 1 });
// };

export const getAllAttendanceByDateRangeService = async (from, to) => {
  const fromDate = parseISTDateOnly(from);
  const toDate = parseISTDateOnly(to);

  // 1️⃣ Get attendance records
  const attendance = await Attendance.find({
    date: { $gte: fromDate, $lte: toDate },
  })
    .populate("user", "name email")
    .lean();

  // 2️⃣ Get work records for punch times
  const workRecords = await WorkRecord.find({
    date: { $gte: fromDate, $lte: toDate },
  }).lean();

  // 3️⃣ Map work records by user+date
  const workMap = new Map();
  workRecords.forEach((w) => {
    workMap.set(`${w.user}_${w.date.getTime()}`, w);
  });

  // 4️⃣ Merge clean response
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

export const getLiveEmployeesStatusService = async () => {
  const today = todayISTUTC();

  const users = await userModel.find({ role: { $ne: "admin" } });

  const records = await workRecordModel.find({ date: today });

  return users.map((u) => {
    const record = records.find((r) => r.user.equals(u._id));

    if (!record) {
      return {
        userId: u._id,
        name: u.name,
        status: "NOT_STARTED",
        workedSeconds: 0,
      };
    }

    const lastBreak = record.breaks.at(-1);
    const onBreak = lastBreak && !lastBreak.out;

    let status = "WORKING";
    if (record.punchOut) status = "COMPLETED";
    else if (onBreak) status = "ON_BREAK";

    return {
      userId: u._id,
      name: u.name,
      status,
      workedSeconds: calcLiveNetSeconds(record),
    };
  });
};

/* ================= ADMIN ================= */
export const getDayAttendanceService = async (date) => {
  const day = parseISTDateOnly(date);
  return attendanceModel.find({ date: day }).populate("user", "name email");
};

/* ================= HELPERS ================= */
export const getTodayWorkRecordService = async (userId) => {
  const record = await workRecordModel.findOne({
    user: userId,
    date: todayISTUTC(),
  });

  if (!record) return null;

  const lastBreak = record.breaks.at(-1);
  const onBreak = lastBreak && !lastBreak.out;

  return {
    ...record.toObject(),

    // 🔥 live computed values
    liveNetSeconds: calcLiveNetSeconds(record),
    serverNow: new Date(),

    // 🔥 state flags
    isRunning: !!record.punchIn && !record.punchOut && !onBreak,
    onBreak,
  };
};
