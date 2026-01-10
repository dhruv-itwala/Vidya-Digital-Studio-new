import express from "express";
import {
  submitReport,
  myReports,
  allReports,
  updateReport,
  downloadReportsByDate,
  getMyReportsByDate,
  downloadCustomReports,
} from "./report.controller.js";
import { roleCheck } from "../middleware/role.middleware.js";
import { protect } from "../middleware/auth.middleware.js";

const reportRoutes = express.Router();

reportRoutes.use(protect);

reportRoutes.post("/submit", submitReport);
reportRoutes.put("/update/:id", updateReport);
reportRoutes.get("/my", myReports);
reportRoutes.get("/my/date", getMyReportsByDate);

// Admin only: download all reports for a date
reportRoutes.get(
  "/download/all",
  roleCheck("admin", "hr"),
  downloadReportsByDate
);
// Admin only: download customized report
reportRoutes.post(
  "/download/custom",
  roleCheck("admin", "hr"),
  downloadCustomReports
);

reportRoutes.get("/all", roleCheck("admin", "hr"), allReports);

export default reportRoutes;
