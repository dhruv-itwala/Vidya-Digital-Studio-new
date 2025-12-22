import {
  submitReportService,
  getMyReportsService,
  getAllReportsService,
  updateReportService,
  getAllReportsByDateService,
  getMyReportByDateService,
} from "../services/report.service.js";
import { downloadAllReportsByDatePDF } from "../services/reportPdf.service.js";

export const submitReport = async (req, res) => {
  try {
    const report = await submitReportService(req.user.id, req.body.workPoints);
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateReport = async (req, res) => {
  try {
    const { workPoints } = req.body;

    if (!Array.isArray(workPoints) || workPoints.length === 0) {
      return res.status(400).json({ message: "Work report cannot be empty" });
    }

    const report = await updateReportService(req.params.id, req.user);

    report.workPoints = workPoints;
    await report.save();

    res.json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const myReports = async (req, res) => {
  const reports = await getMyReportsService(req.user.id);
  res.json(reports);
};

export const allReports = async (req, res) => {
  const { date } = req.query;

  try {
    let reports;
    if (date) {
      reports = await getAllReportsByDateService(date);
    } else {
      reports = await getAllReportsService();
    }

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const downloadReportsByDate = async (req, res) => {
  try {
    await downloadAllReportsByDatePDF(req, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyReportsByDate = async (req, res) => {
  try {
    let { date } = req.query;

    // ✅ fallback to today's date if not provided
    if (!date || date === "undefined") {
      date = new Date().toISOString().split("T")[0];
    }

    const report = await getMyReportByDateService(req.user.id, date);

    res.json(report); // null if not submitted
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
