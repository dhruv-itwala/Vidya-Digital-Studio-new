import express from "express";
import * as ctrl from "./leaveBalance.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";

const LeaveBalanceRoutes = express.Router();
LeaveBalanceRoutes.use(protect);

// Employee
LeaveBalanceRoutes.get("/me", ctrl.getMyLeaveBalance);
LeaveBalanceRoutes.post("/take", ctrl.takeLeave);

// Admin / HR
LeaveBalanceRoutes.get(
  "/alldata",
  roleCheck("admin", "hr"),
  ctrl.getAllLeaveBalances,
);

LeaveBalanceRoutes.post(
  "/add/:userId",
  roleCheck("admin", "hr"),
  ctrl.addLeaves,
);

export default LeaveBalanceRoutes;
