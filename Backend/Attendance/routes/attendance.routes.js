import express from "express";
import {
  punchIn,
  breakStart,
  breakEnd,
  punchOut,
  myAttendance,
  allAttendance,
  downloadPDF,
} from "../controllers/attendance.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { roleCheck } from "../../middleware/role.middleware.js";

const attendenceRoutes = express.Router();

attendenceRoutes.use(protect);

attendenceRoutes.post("/punch-in", punchIn);
attendenceRoutes.post("/break-start", breakStart);
attendenceRoutes.post("/break-end", breakEnd);
attendenceRoutes.post("/punch-out", punchOut);

attendenceRoutes.get("/my", myAttendance);
attendenceRoutes.get("/all", roleCheck("admin"), allAttendance);
attendenceRoutes.get("/download", roleCheck("admin"), downloadPDF);

export default attendenceRoutes;
