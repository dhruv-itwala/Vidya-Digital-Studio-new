// Backend/Reports/report.controller.js
import {
  submitReportService,
  getMyReportsService,
  getAllReportsService,
  updateReportService,
  getAllReportsByDateService,
  getMyReportByDateService,
} from "./report.service.js";

import {
  downloadAllReportsByDatePDF,
  downloadCustomReportsPDF,
} from "./reportPdf.service.js";

import { asyncHandler } from "../utils/asyncHandler.js";

// ============== SUBMIT REPORT =======================
export const submitReport = asyncHandler(async (req, res) => {
  const report = await submitReportService(req.user.id, req.body.workPoints);

  res.status(201).json({
    success: true,
    message: "Report submitted successfully",
    data: report,
  });
});

// ============== UPDATE REPORT =======================
export const updateReport = asyncHandler(async (req, res) => {
  const { workPoints } = req.body;

  const report = await updateReportService(req.params.id, req.user, workPoints);

  res.json({
    success: true,
    message: "Report updated successfully",
    data: report,
  });
});

// ============== MY REPORTS =======================
export const myReports = asyncHandler(async (req, res) => {
  const reports = await getMyReportsService(req.user.id);

  res.json({
    success: true,
    count: reports.length,
    data: reports,
  });
});

// ============== MY REPORT BY DATE =======================
export const getMyReportsByDate = asyncHandler(async (req, res) => {
  let { date } = req.query;

  // Fallback to today (IST-normalized inside service)
  if (!date || date === "undefined") {
    date = new Date();
  }

  const report = await getMyReportByDateService(req.user.id, date);

  res.json({
    success: true,
    data: report, // null if not submitted
  });
});

// ============== ALL REPORTS =======================
export const allReports = asyncHandler(async (req, res) => {
  const { date } = req.query;

  const reports = date
    ? await getAllReportsByDateService(date)
    : await getAllReportsService();

  res.json({
    success: true,
    count: reports.length,
    data: reports,
  });
});

// ============== DOWNLOAD REPORTS BY DATE =======================
export const downloadReportsByDate = asyncHandler(async (req, res) => {
  await downloadAllReportsByDatePDF(req, res);
});

// ============== DOWNLOAD CUSTOM REPORTS =======================
export const downloadCustomReports = asyncHandler(async (req, res) => {
  await downloadCustomReportsPDF(req, res);
});
