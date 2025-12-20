import {
  punchInService,
  breakStartService,
  breakEndService,
  punchOutService,
  getMyAttendanceService,
  getAllAttendanceService,
} from "../services/attendance.service.js";
import { downloadAttendancePDF } from "../services/attendancePdf.service.js";

export const punchIn = async (req, res) => {
  try {
    const data = await punchInService(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const breakStart = async (req, res) => {
  try {
    const data = await breakStartService(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const breakEnd = async (req, res) => {
  try {
    const data = await breakEndService(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const punchOut = async (req, res) => {
  try {
    const data = await punchOutService(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const myAttendance = async (req, res) => {
  const data = await getMyAttendanceService(req.user.id);
  res.json(data);
};

export const allAttendance = async (req, res) => {
  const { from, to } = req.query;
  const data = await getAllAttendanceService(from, to);
  res.json(data);
};

export const downloadPDF = async (req, res) => {
  try {
    await downloadAttendancePDF(req, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
