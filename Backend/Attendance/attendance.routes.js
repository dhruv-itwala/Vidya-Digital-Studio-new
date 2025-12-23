import express from "express";
import * as ctrl from "./attendance.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";

const attendenceRoutes = express.Router();

// All attendance routes are protected
attendenceRoutes.use(protect);

/* ========== EMPLOYEE ROUTES ========== */
attendenceRoutes.get("/work-record/today", ctrl.getTodayWorkRecord);
attendenceRoutes.post("/punch-in", ctrl.punchIn);
attendenceRoutes.post("/punch-out", ctrl.punchOut);

attendenceRoutes.post("/break-in", ctrl.breakIn);
attendenceRoutes.post("/break-out", ctrl.breakOut);

attendenceRoutes.get("/my", ctrl.myAttendance);
attendenceRoutes.get("/my/date", ctrl.myAttendanceByDate);

/* ========== HR ROUTES ========== */

attendenceRoutes.get("/all", roleCheck("hr"), ctrl.getAllEmployeesAttendance);

attendenceRoutes.post("/mark", roleCheck("hr"), ctrl.markAttendanceStatus);

/* ========== ADMIN ROUTES ========== */

attendenceRoutes.get("/day", roleCheck("admin"), ctrl.dayAttendance);

export default attendenceRoutes;
