import Report from "./report.model.js";

const today = () => new Date().toISOString().split("T")[0];

export const submitReportService = async (userId, workPoints) => {
  if (!Array.isArray(workPoints) || workPoints.length === 0) {
    throw new Error("Work report cannot be empty");
  }

  const date = today();

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

export const getMyReportByDateService = async (userId, date) => {
  return Report.findOne({ user: userId, date });
};
