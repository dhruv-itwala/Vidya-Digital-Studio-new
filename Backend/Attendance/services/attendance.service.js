import attendanceModel from "../models/attendance.model.js";
import {
  getISTNow,
  getISTDayStart,
  isWithinOfficeHours,
  recalcMinutes,
  calcStatus,
} from "../attendance.utils.js";
import userModel from "../../Users/models/user.model.js";
import holidayModel from "../../Holidays/model/holiday.model.js";

/* ================= PUNCH IN ================= */
export const punchInService = async (userId) => {
  const now = getISTNow();

  if (!isWithinOfficeHours(now)) {
    throw new Error("Punch in allowed only between 10AM – 7PM IST");
  }

  const today = getISTDayStart();

  const attendance = await attendanceModel.findOneAndUpdate(
    { user: userId, date: today },
    { $setOnInsert: { status: "PRESENT" } },
    { upsert: true, new: true }
  );

  const lastSession = attendance.sessions.at(-1);
  if (lastSession && !lastSession.out) {
    throw new Error("Already punched in");
  }

  attendance.sessions.push({ in: now });
  return attendance.save();
};

/* ================= PUNCH OUT ================= */
export const punchOutService = async (userId) => {
  const now = getISTNow();
  const today = getISTDayStart();

  const attendance = await attendanceModel.findOne({
    user: userId,
    date: today,
  });
  if (!attendance) throw new Error("No attendance found");

  const session = attendance.sessions.at(-1);
  if (!session || session.out) throw new Error("Punch in first");

  const lastBreak = attendance.breaks.at(-1);
  if (lastBreak && !lastBreak.out) lastBreak.out = now;

  session.out = now;

  recalcMinutes(attendance);
  attendance.status = calcStatus(attendance.totalMinutes);

  return attendance.save();
};

/* ================= BREAK IN ================= */
export const breakInService = async (userId) => {
  const now = getISTNow();
  const today = getISTDayStart();

  const attendance = await attendanceModel.findOne({
    user: userId,
    date: today,
  });
  if (!attendance) throw new Error("Punch in first");

  const session = attendance.sessions.at(-1);
  if (!session || session.out) {
    throw new Error("No active work session");
  }

  const lastBreak = attendance.breaks.at(-1);
  if (lastBreak && !lastBreak.out) {
    throw new Error("Already on break");
  }

  attendance.breaks.push({ in: now });
  return attendance.save();
};

/* ================= BREAK OUT ================= */
export const breakOutService = async (userId) => {
  const now = getISTNow();
  const today = getISTDayStart();

  const attendance = await attendanceModel.findOne({
    user: userId,
    date: today,
  });
  if (!attendance) throw new Error("Attendance not found");

  const lastBreak = attendance.breaks.at(-1);
  if (!lastBreak || lastBreak.out) {
    throw new Error("No active break");
  }

  lastBreak.out = now;
  return attendance.save();
};

/* ================= MY ATTENDANCE ================= */
export const getMyAttendanceService = async (userId, from, to) => {
  const fromDate = getISTDayStart(new Date(from));
  const toDate = getISTDayStart(new Date(to));

  return attendanceModel
    .find({ user: userId, date: { $gte: fromDate, $lte: toDate } })
    .sort({ date: 1 });
};

/* ================= ADMIN ================= */
export const getDayAttendanceService = async (date) => {
  const day = getISTDayStart(new Date(date));
  return attendanceModel.find({ date: day }).populate("user", "name email");
};

/* ================= MARK STATUS FOR HR ================= */
export const markAttendanceStatusService = async (userId, date, status) => {
  if (!["PRESENT", "HALF_DAY", "ABSENT", "HOLIDAY", "LEAVE"].includes(status)) {
    throw new Error("Invalid status");
  }

  const day = getISTDayStart(new Date(date));

  // Find existing or create new attendance
  const attendance = await attendanceModel.findOneAndUpdate(
    { user: userId, date: day },
    { status },
    { upsert: true, new: true }
  );

  return attendance;
};

// ================= GET ALL EMPLOYEES ATTENDANCE FOR A DAY =================
export const getAllEmployeesAttendanceService = async (date) => {
  const day = getISTDayStart(new Date(date));

  // Get all users with role employee
  const employees = await userModel
    .find({ role: { $ne: "HR" } })
    .select("_id name email");

  // Get attendance for the day
  const attendanceList = await attendanceModel.find({ date: day });

  // Get holidays
  const holiday = await holidayModel.findOne({ date: day });

  // Merge attendance with employee list
  const result = employees.map((emp) => {
    const attendance = attendanceList.find(
      (a) => a.user.toString() === emp._id.toString()
    );

    return {
      _id: emp._id,
      name: emp.name,
      email: emp.email,
      status: attendance ? attendance.status : holiday ? "HOLIDAY" : "ABSENT",
      attendanceId: attendance ? attendance._id : null,
    };
  });

  return result;
};
