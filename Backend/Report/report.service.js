import attendanceModel from "../Attendance/attendance.model.js";
import workRecordModel from "../Attendance/workRecord.model.js";
import Report from "./report.model.js";

const today = () => new Date().toISOString().split("T")[0];

export const submitReportService = async (userId, workPoints) => {
  if (!Array.isArray(workPoints) || workPoints.length === 0) {
    throw new Error("Work report cannot be empty");
  }

  const date = today();

  // 🔒 Check attendance first
  const attendance = await attendanceModel.findOne({
    user: userId,
    date: new Date(date),
  });

  if (attendance?.status === "LEAVE") {
    throw new Error("You cannot submit a report while on leave");
  }

  if (attendance?.status === "HOLIDAY") {
    throw new Error("You cannot submit a report on a holiday");
  }

  const exists = await Report.findOne({ user: userId, date });
  if (exists) throw new Error("Report already submitted for today");

  return Report.create({
    user: userId,
    date,
    workPoints,
  });
};

export const getMyReportsByDateService = async (userId, date) => {
  return Report.find({ user: userId, date }).sort({ date: -1 });
};

export const getMyReportsService = async (userId) => {
  return Report.find({ user: userId }).sort({ date: -1 });
};

export const getAllReportsService = async () => {
  return Report.find().populate("user", "name email").sort({ date: -1 });
};

export const getReportByIdService = async (reportId) => {
  return Report.findById(reportId).populate("user", "name email");
};

export const updateReportService = async (reportId, user) => {
  const report = await Report.findById(reportId);

  if (!report) {
    throw new Error("Report not found");
  }

  // Employee can update only their own report
  if (user.role === "employee" && report.user.toString() !== user.id) {
    throw new Error("Forbidden");
  }

  // Optional: allow update only for today's report
  const todayDate = new Date().toISOString().split("T")[0];
  if (report.date !== todayDate && user.role === "employee") {
    throw new Error("You can only update today's report");
  }

  return report;
};

export const getAllReportsByDateService = async (date) => {
  return Report.find({ date }).populate("user", "name email");
};

export const getWorkRecordsByDateService = async (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return workRecordModel
    .find({
      date: { $gte: start, $lte: end },
    })
    .populate("user", "name email");
};

export const getReportsWithWorkingHrsByDateService = async (date) => {
  const reports = await Report.find({ date }).populate("user", "name email");
  const workRecords = await getWorkRecordsByDateService(date);

  // Create lookup: userId → workRecord
  const workMap = {};
  workRecords.forEach((wr) => {
    workMap[wr.user._id.toString()] = wr;
  });

  return reports.map((report) => {
    const wr = workMap[report.user._id.toString()];

    return {
      ...report.toObject(),
      workingMinutes: wr?.totalWorkMinutes || 0,
      workingHours: wr ? (wr.totalWorkMinutes / 60).toFixed(2) : "0.00",
    };
  });
};

export const getMyReportByDateService = async (userId, date) => {
  return Report.findOne({ user: userId, date });
};
