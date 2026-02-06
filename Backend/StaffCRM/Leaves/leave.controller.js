import * as service from "./leave.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ---------- APPLY LEAVE ----------
export const applyLeave = asyncHandler(async (req, res) => {
  const leave = await service.applyLeaveService(req.user.id, req.body);
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
  res.json(leave);
});

// ---------- ADMIN: DECLINE LEAVE ----------
export const declineLeave = asyncHandler(async (req, res) => {
  const leave = await service.declineLeaveService(req.params.id, req.user.id);
  res.json(leave);
});

// ---------- CANCEL LEAVE (EMPLOYEE) ----------
export const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await service.cancelLeaveService(req.params.id, req.user);

  res.json(leave);
});

// ---------- LEAVE SUMMARY ----------
export const leaveSummary = asyncHandler(async (req, res) => {
  const summary = await service.leaveSummaryService(req.user.id);
  res.json(summary);
});
