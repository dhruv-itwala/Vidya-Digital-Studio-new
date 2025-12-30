// Backend/Attendance/attendance.controller.js
import * as service from "./attendance.service.js";
import { downloadAttendancePDFService } from "./attendancePdf.service.js";
import { downloadAttendanceWithPunchPDFService } from "./attendancePdfWithPunch.js";

/* ================= EMPLOYEE ================= */

export const getTodayWorkRecord = async (req, res) => {
  try {
    const data = await service.getTodayWorkRecordService(req.user.id);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// Punch In
export const punchIn = async (req, res) => {
  try {
    const data = await service.punchInService(req.user.id);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// Punch Out
export const punchOut = async (req, res) => {
  try {
    const data = await service.punchOutService(req.user.id);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// Break In
export const breakIn = async (req, res) => {
  try {
    const data = await service.breakInService(req.user.id);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// Break Out
export const breakOut = async (req, res) => {
  try {
    const data = await service.breakOutService(req.user.id);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// Employee: get own attendance range
export const myAttendance = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await service.getMyAttendanceService(req.user.id, from, to);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// Employee: get attendance by date
export const myAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const data = await service.getUserAttendanceByDateService(
      req.user.id,
      date
    );
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

/* ================= HR ================= */

// HR: get all employees attendance for a day
export const getAllEmployeesAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) throw new Error("Date is required");

    const data = await service.getAllEmployeesAttendanceService(date);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// HR: get employee attendance by date range
export const getAllEmployeesAttendanceByDateRange = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      throw new Error("from and to are required");
    }

    const data = await service.getAllAttendanceByDateRangeService(from, to);

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// HR: mark / update attendance
export const markAttendanceStatus = async (req, res) => {
  try {
    const { userId, date, status } = req.body;

    const attendance = await service.markAttendanceStatusService(
      userId,
      date,
      status
    );

    res.json({
      message: "Attendance updated",
      attendance,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const getLiveEmployeesStatus = async (req, res) => {
  try {
    const data = await service.getLiveEmployeesStatusService();
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

/* ================= ADMIN ================= */
export const dayAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const data = await service.getDayAttendanceService(date);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const downloadAttendancePDF = async (req, res) => {
  try {
    await downloadAttendancePDFService(req, res);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const downloadAttendanceWithPunchPDF = async (req, res) => {
  try {
    await downloadAttendanceWithPunchPDFService(req, res);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
