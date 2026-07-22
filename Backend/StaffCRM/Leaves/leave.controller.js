import * as service from "./leave.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../AuditLog/AuditLog.service.js";

// ---------- APPLY LEAVE ----------
export const applyLeave = asyncHandler(async (req, res) => {
  const leave = await service.applyLeaveService(req.user.id, req.body);
  logActivity({
    req,
    user: req.user,
    category: "HR",
    module: "Leaves",
    action: "CREATE",
    entityId: leave._id,
    description: `${req.user.name} applied for leave`,
  });
  res.status(201).json(leave);
});

// ---------- GET MY LEAVES ----------
export const myLeaves = asyncHandler(async (req, res) => {
  const leaves = await service.getMyLeavesService(req.user.id);
  res.json(leaves);
});

// ---------- ADMIN: GET ALL LEAVES ----------
export const allLeaves = asyncHandler(async (req, res) => {
  const leaves = await service.getAllLeavesService();
  res.json(leaves);
});

// ---------- ADMIN: APPROVE LEAVE ----------
export const approveLeave = asyncHandler(async (req, res) => {
  const leave = await service.approveLeaveService(req.params.id, req.user.id);
  logActivity({
    req,
    user: req.user,
    category: "HR",
    module: "Leaves",
    action: "STATUS_CHANGE",
    entityId: leave._id,
    description: `${req.user.name} approved a leave`,
  });
  res.json(leave);
});

// ---------- ADMIN: DECLINE LEAVE ----------
export const declineLeave = asyncHandler(async (req, res) => {
  const leave = await service.declineLeaveService(req.params.id, req.user.id);
  logActivity({
    req,
    user: req.user,
    category: "HR",
    severity: "WARNING",
    module: "Leaves",
    action: "STATUS_CHANGE",
    entityId: leave._id,
    description: `${req.user.name} declined a leave`,
  });
  res.json(leave);
});

// ---------- CANCEL LEAVE (EMPLOYEE) ----------
export const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await service.cancelLeaveService(req.params.id, req.user);

  logActivity({
    req,
    user: req.user,
    category: "HR",
    severity: "WARNING",
    module: "Leaves",
    action: "UPDATE",
    entityId: leave._id,
    description: `${req.user.name} cancelled their leave`,
  });

  res.json(leave);
});

// ---------- LEAVE SUMMARY ----------
export const leaveSummary = asyncHandler(async (req, res) => {
  const summary = await service.leaveSummaryService(req.user.id);
  res.json(summary);
});

// ---------- LEAVE ANALYTICS ----------
export const allUsersLeaveAnalytics = asyncHandler(async (req, res) => {
  const year = req.query.year || new Date().getFullYear();

  const data = await service.allUsersLeaveAnalyticsService(year);

  res.json(data);
});
