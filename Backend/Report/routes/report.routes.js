import express from "express";
import {
  submitReport,
  myReports,
  allReports,
  updateReport,
  downloadReportsByDate,
} from "../controllers/report.controller.js";
import { roleCheck } from "../../middleware/role.middleware.js";
import { protect } from "../../middleware/auth.middleware.js";

const reportRoutes = express.Router();

reportRoutes.use(protect);

reportRoutes.post("/submit", submitReport);
reportRoutes.put("/update/:id", updateReport);
reportRoutes.get("/my", myReports);
// Admin only: download all reports for a date
reportRoutes.get("/download/all", roleCheck("admin"), downloadReportsByDate);
// Admin only
reportRoutes.get("/all", roleCheck("admin"), allReports);

export default reportRoutes;
