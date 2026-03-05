// Backend/StaffCRM/Attendance/attendance.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import * as service from "./attendance.service.js";
import { downloadAttendancePDFService } from "./attendancePdf.service.js";
import { downloadAttendanceWithPunchPDFService } from "./attendancePdfWithPunch.js";

// ================= TODAY WORK RECORD ================= */
export const getTodayWorkRecord = asyncHandler(async (req, res) => {
  const data = await service.getTodayWorkRecordService(req.user.id);
  res.json({ success: true, data });
});

// ================= PUNCH IN ================= */
export const punchIn = asyncHandler(async (req, res) => {
  const data = await service.punchInService(req.user.id);
  res.json({ success: true, data });
});

// ================= PUNCH OUT ================= */
export const punchOut = asyncHandler(async (req, res) => {
  const data = await service.punchOutService(req.user.id);
  res.json({ success: true, data });
});

// ================ BREAK IN ================= */
export const breakIn = asyncHandler(async (req, res) => {
  const data = await service.breakInService(req.user.id);
  res.json({ success: true, data });
});

// ================ BREAK OUT ================= */
export const breakOut = asyncHandler(async (req, res) => {
  const data = await service.breakOutService(req.user.id);
  res.json({ success: true, data });
});

// ================= MY ATTENDANCE ================= */
export const myAttendance = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const data = await service.getMyAttendanceService(req.user.id, from, to);
  res.json({ success: true, data });
});

// ================= MY ATTENDANCE BY DATE ================= */
export const myAttendanceByDate = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const data = await service.getUserAttendanceByDateService(req.user.id, date);
  res.json({ success: true, data });
});

// ================= ALL EMPLOYEES ATTENDANCE ================= */
export const getAllEmployeesAttendance = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const data = await service.getAllEmployeesAttendanceService(date);
  res.json({ success: true, data });
});

// ================= ALL EMPLOYEES ATTENDANCE BY DATE RANGE ================= */
export const getAllEmployeesAttendanceByDateRange = asyncHandler(
  async (req, res) => {
    const { from, to } = req.query;
    const data = await service.getAllAttendanceByDateRangeService(from, to);
    res.json({
      success: true,
      count: data.length,
      data,
    });
  },
);

// ================= MARK ATTENDANCE STATUS ================= */
export const markAttendanceStatus = asyncHandler(async (req, res) => {
  const { userId, date, status } = req.body;

  const attendance = await service.markAttendanceStatusService(
    userId,
    date,
    status,
  );

  res.json({
    success: true,
    message: "Attendance updated",
    attendance,
  });
});

// ================= LIVE EMPLOYEES STATUS ================= */
export const getLiveEmployeesStatus = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const data = await service.getLiveEmployeesStatusByDateService(date);
  res.json({ success: true, data });
});

// ================= DAY ATTENDANCE ================= */
export const dayAttendance = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const data = await service.getDayAttendanceService(date);
  res.json({ success: true, data });
});

// ================ DOWNLOAD ATTENDANCE PDF ================= */
export const downloadAttendancePDF = asyncHandler(async (req, res) => {
  await downloadAttendancePDFService(req, res);
});

// ================ DOWNLOAD ATTENDANCE WITH PUNCH PDF ================= */
export const downloadAttendanceWithPunchPDF = asyncHandler(async (req, res) => {
  await downloadAttendanceWithPunchPDFService(req, res);
});

// ================ DELETE ATTENDANCE BY ID ================= */
export const deleteAttendanceById = asyncHandler(async (req, res) => {
  const { attendanceId } = req.params;
  await service.deleteAttendanceByIdService(attendanceId);
  res.json({ success: true, message: "Attendance record deleted" });
});

// ================ GET WEEKLY PROGRESS ================= */
export const getWeeklyProgress = asyncHandler(async (req, res) => {
  const data = await service.getWeeklyProgressService(req.user.id);

  res.json({
    success: true,
    data,
  });
});

// ================= GET ALL USER WEEKLY PROGRESS ================= */
export const getAllUsersWeeklyProgress = asyncHandler(async (req, res) => {
  const { weekStart } = req.query;
  const data = await service.getAllUsersWeeklyProgressService(weekStart);
  res.json({
    success: true,
    data,
  });
});
