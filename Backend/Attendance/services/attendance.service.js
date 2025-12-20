import Attendance from "../models/attendance.model.js";
import Report from "../../Report/models/report.model.js";

const today = () => new Date().toISOString().split("T")[0];

export const punchInService = async (userId) => {
  const date = today();

  const exists = await Attendance.findOne({ user: userId, date });
  if (exists) throw new Error("Already punched in today");

  return Attendance.create({
    user: userId,
    date,
    punchIn: new Date(),
  });
};

export const breakStartService = async (userId) => {
  const attendance = await Attendance.findOne({
    user: userId,
    punchOut: null,
  });

  if (!attendance) throw new Error("Punch in first");

  const lastBreak = attendance.breaks.at(-1);
  if (lastBreak && !lastBreak.breakOut)
    throw new Error("Break already in progress");

  attendance.breaks.push({ breakIn: new Date() });
  await attendance.save();

  return attendance;
};

export const breakEndService = async (userId) => {
  const attendance = await Attendance.findOne({
    user: userId,
    punchOut: null,
  });

  if (!attendance) throw new Error("Punch in first");

  const lastBreak = attendance.breaks.at(-1);
  if (!lastBreak || lastBreak.breakOut) throw new Error("No active break");

  lastBreak.breakOut = new Date();
  await attendance.save();

  return attendance;
};

export const punchOutService = async (userId) => {
  const date = today();

  const attendance = await Attendance.findOne({
    user: userId,
    date,
    punchOut: null,
  });

  if (!attendance) throw new Error("No active attendance");

  // REPORT CHECK
  const report = await Report.findOne({ user: userId, date });
  if (!report) throw new Error("Submit work report before punch-out");

  attendance.punchOut = new Date();

  // Calculate total minutes
  let totalMs = attendance.punchOut - attendance.punchIn;

  attendance.breaks.forEach((b) => {
    if (b.breakIn && b.breakOut) {
      totalMs -= b.breakOut - b.breakIn;
    }
  });

  attendance.totalMinutes = Math.floor(totalMs / 60000);
  await attendance.save();

  return attendance;
};

export const getMyAttendanceService = async (userId, days = 45) => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  return Attendance.find({
    user: userId,
    createdAt: { $gte: fromDate },
  }).sort({ date: -1 });
};

export const getAllAttendanceService = async (from, to) => {
  const query = {};

  if (from && to) {
    query.date = { $gte: from, $lte: to }; // filter by date range
  }

  return Attendance.find(query)
    .populate("user", "name email")
    .sort({ date: -1 });
};
