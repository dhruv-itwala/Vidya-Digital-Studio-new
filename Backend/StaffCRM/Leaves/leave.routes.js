import express from "express";
import * as ctrl from "./leave.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";
import { apiLogger } from "../../logger/logger.middleware.js";

const LeaveRoutes = express.Router();
LeaveRoutes.use(protect);
LeaveRoutes.use(apiLogger);

// Employee
LeaveRoutes.post("/apply", ctrl.applyLeave);
LeaveRoutes.get("/my", ctrl.myLeaves);
LeaveRoutes.post("/:id/cancel", ctrl.cancelLeave);
LeaveRoutes.get("/summary", ctrl.leaveSummary);
LeaveRoutes.get("/all", ctrl.allLeaves);

// Both Admin and HR can access these routes
LeaveRoutes.post("/:id/approve", roleCheck("admin", "hr"), ctrl.approveLeave);
LeaveRoutes.post("/:id/decline", roleCheck("admin", "hr"), ctrl.declineLeave);

LeaveRoutes.get(
  "/analytics/all",
  roleCheck("admin", "hr"),
  ctrl.allUsersLeaveAnalytics,
);

export default LeaveRoutes;
