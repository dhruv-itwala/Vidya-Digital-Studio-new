import express from "express";
import * as ctrl from "../controllers/attendance.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { roleCheck } from "../../middleware/role.middleware.js";

const attendanceRoutes = express.Router();
attendanceRoutes.use(protect);

// Employee
attendanceRoutes.post("/punch-in", ctrl.punchIn);
attendanceRoutes.post("/punch-out", ctrl.punchOut);
attendanceRoutes.post("/break-in", ctrl.breakIn);
attendanceRoutes.post("/break-out", ctrl.breakOut);

attendanceRoutes.get("/my", ctrl.myAttendance);
attendanceRoutes.get("/my/date", ctrl.getUserAttendanceByDate);

// HR: mark attendance
attendanceRoutes.get("/all", roleCheck("hr"), ctrl.getAllEmployeesAttendance);
attendanceRoutes.post("/mark", roleCheck("hr"), ctrl.markAttendanceStatus);

// Admin
attendanceRoutes.get("/day", roleCheck("admin"), ctrl.dayAttendance);

export default attendanceRoutes;
