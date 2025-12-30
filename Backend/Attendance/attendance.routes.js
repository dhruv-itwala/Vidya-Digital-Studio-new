// Backend/Attendance/attendance.routes.js
import express from "express";
import * as ctrl from "./attendance.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";

const attendanceRoutes = express.Router();

// All attendance routes are protected
attendanceRoutes.use(protect);

/* ========== EMPLOYEE ROUTES ========== */
attendanceRoutes.get("/work-record/today", ctrl.getTodayWorkRecord);
attendanceRoutes.post("/punch-in", ctrl.punchIn);
attendanceRoutes.post("/punch-out", ctrl.punchOut);

attendanceRoutes.post("/break-in", ctrl.breakIn);
attendanceRoutes.post("/break-out", ctrl.breakOut);

attendanceRoutes.get("/my", ctrl.myAttendance);
attendanceRoutes.get("/my/date", ctrl.myAttendanceByDate);

/* ========== HR ROUTES ========== */

attendanceRoutes.get("/all", roleCheck("hr"), ctrl.getAllEmployeesAttendance);
attendanceRoutes.post("/mark", roleCheck("hr"), ctrl.markAttendanceStatus);

attendanceRoutes.get(
  "/all/date",
  roleCheck("admin", "hr"),
  ctrl.getAllEmployeesAttendanceByDateRange
);

attendanceRoutes.get(
  "/live-status",
  roleCheck("admin", "hr"),
  ctrl.getLiveEmployeesStatus
);

/* ========== ADMIN ROUTES ========== */

attendanceRoutes.get("/day", roleCheck("admin"), ctrl.dayAttendance);

attendanceRoutes.get(
  "/download/pdf",
  roleCheck("admin", "hr"),
  ctrl.downloadAttendancePDF
);

attendanceRoutes.get(
  "/download/timepdf",
  roleCheck("admin", "hr"),
  ctrl.downloadAttendanceWithPunchPDF
);

export default attendanceRoutes;
