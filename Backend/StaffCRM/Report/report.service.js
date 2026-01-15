import Attendance from "../Attendance/attendance.model.js";
import WorkRecord from "../Attendance/workRecord.model.js";
import Report from "./report.model.js";
import { getISTDayRange, normalizeDate } from "../utils/date.utils.js";
import AppError from "../utils/AppError.js";

/* ================= HELPERS ================= */

// Always returns IST midnight stored in UTC
const todayISTDate = () => normalizeDate(new Date());

/* ================= SUBMIT REPORT ================= */

export const submitReportService = async (userId, workPoints) => {
  if (!Array.isArray(workPoints) || workPoints.length === 0) {
    throw new AppError("Work report cannot be empty", 400);
  }

  const today = todayISTDate();
  const { start, end } = getISTDayRange(today);

  // 🔒 Attendance check (RANGE BASED)
  const attendance = await Attendance.findOne({
    user: userId,
    date: { $gte: start, $lt: end },
  });

  if (attendance?.status === "LEAVE") {
    throw new AppError("You cannot submit a report while on leave", 403);
  }

  if (attendance?.status === "HOLIDAY") {
    throw new AppError("You cannot submit a report on a holiday", 403);
  }

  // 🔒 Prevent duplicate submission
  const exists = await Report.exists({
    user: userId,
    date: { $gte: start, $lt: end },
  });

  if (exists) {
    throw new AppError("Report already submitted for today", 409);
  }

  return Report.create({
    user: userId,
    date: today,
    workPoints,
  });
};

/* ================= MY REPORTS ================= */

export const getMyReportsService = async (userId) => {
  return Report.find({ user: userId }).sort({ date: -1 });
};

/* ================= MY REPORT BY DATE ================= */

export const getMyReportByDateService = async (userId, dateStr) => {
  const { start, end } = getISTDayRange(dateStr);

  return Report.findOne({
    user: userId,
    date: { $gte: start, $lt: end },
  });
};

/* ================= ADMIN: ALL REPORTS ================= */

export const getAllReportsService = async () => {
  return Report.find().populate("user", "name email").sort({ date: -1 });
};

/* ================= UPDATE REPORT ================= */
export const updateReportService = async (reportId, user, workPoints) => {
  const report = await Report.findById(reportId);

  if (!report) {
    throw new AppError("Report not found", 404);
  }

  // Employee can update only their own report
  if (user.role === "employee" && report.user.toString() !== user.id) {
    throw new AppError("Forbidden", 403);
  }

  // ✅ CORRECT: Check if report belongs to TODAY (IST)
  if (user.role === "employee") {
    const { start, end } = getISTDayRange(new Date());

    if (!(report.date >= start && report.date < end)) {
      throw new AppError("You can only update today's report", 403);
    }
  }

  if (!Array.isArray(workPoints) || workPoints.length === 0) {
    throw new AppError("Work report cannot be empty", 400);
  }

  report.workPoints = workPoints;
  await report.save();

  return report;
};

/* ================= REPORTS BY DATE ================= */

export const getAllReportsByDateService = async (dateStr) => {
  const { start, end } = getISTDayRange(dateStr);

  return Report.find({
    date: { $gte: start, $lt: end },
  }).populate("user", "name email");
};

/* ================= REPORTS BY DATE RANGE ================= */

export const getReportsByEmployeesAndDateRangeService = async (
  employeeIds,
  fromDateStr,
  toDateStr
) => {
  const { start: from } = getISTDayRange(fromDateStr);
  const { end: to } = getISTDayRange(toDateStr);

  return Report.find({
    user: { $in: employeeIds },
    date: { $gte: from, $lt: to },
  })
    .populate("user", "name email")
    .sort({ user: 1, date: 1 });
};

/* ================= REPORTS WITH WORKING HOURS ================= */

export const getReportsWithWorkingHrsByDateService = async (dateStr) => {
  const { start, end } = getISTDayRange(dateStr);

  const [reports, workRecords] = await Promise.all([
    Report.find({
      date: { $gte: start, $lt: end },
    })
      .populate("user", "name email")
      .lean(),

    WorkRecord.find({
      date: { $gte: start, $lt: end },
    }).lean(),
  ]);

  const workMap = new Map();
  workRecords.forEach((wr) => {
    workMap.set(wr.user.toString(), wr);
  });

  return reports.map((report) => {
    const wr = workMap.get(report.user._id.toString());

    return {
      ...report,
      workingMinutes: wr?.totalWorkMinutes || 0,
      workingHours: wr ? (wr.totalWorkMinutes / 60).toFixed(2) : "0.00",
    };
  });
};
