import * as service from "./leavebalance.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ---------- GET MY BALANCE ----------
export const getMyLeaveBalance = asyncHandler(async (req, res) => {
  const wallet = await service.getLeaveBalanceService(req.user.id);

  res.json({
    availableLeaves: wallet.availableLeaves,
    leaveHistory: wallet.leaveHistory,
  });
});

// ---------- TAKE LEAVE ----------
export const takeLeave = asyncHandler(async (req, res) => {
  const wallet = await service.takeLeaveService(req.user.id, req.body);
  res.json(wallet);
});

// ---------- ADMIN: ADD LEAVES ----------
export const addLeaves = asyncHandler(async (req, res) => {
  const wallet = await service.addLeavesService(
    req.params.userId,
    req.body.amount,
  );
  res.json(wallet);
});

// ---------- ADMIN: GET ALL LEAVE BALANCES ----------
export const getAllLeaveBalances = asyncHandler(async (req, res) => {
  const allBalances = await service.getAllLeaveBalancesService();
  res.json(allBalances);
});
