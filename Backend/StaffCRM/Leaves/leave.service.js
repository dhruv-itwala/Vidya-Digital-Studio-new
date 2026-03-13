import mongoose from "mongoose";
import leavesModel from "./leave.model.js";
import holidayModel from "../Holidays/holiday.model.js";
import attendanceModel from "../Attendance/attendance.model.js";
import AppError from "../utils/AppError.js";
import { getISTDayRange, normalizeDate } from "../utils/date.utils.js";
import {
  deductForApprovedLeave,
  refundForCancelledLeave,
} from "../leaveBalance/leaveBalance.service.js";

// ---------- HELPERS ----------
const getDateRange = (from, to) => {
  const dates = [];
  let current = new Date(from);

  while (current <= to) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
};

// ---------- APPLY LEAVE ----------
export const applyLeaveService = async (userId, data) => {
  const fromDate = normalizeDate(data.fromDate);
  const toDate = normalizeDate(data.toDate);

  if (fromDate > toDate) {
    throw new AppError("From date cannot be after To date", 400);
  }

  if (data.isHalfDay && fromDate.getTime() !== toDate.getTime()) {
    throw new AppError("Half-day leave must be for a single day", 400);
  }

  // ❌ Holiday check (range based)
  const holiday = await holidayModel.findOne({
    date: { $gte: fromDate, $lte: toDate },
  });

  if (holiday) {
    throw new AppError("Leave range contains a holiday", 409);
  }

  // ❌ Overlapping leave check
  const overlapping = await leavesModel.findOne({
    user: userId,
    status: { $in: ["PENDING", "APPROVED"] },
    fromDate: { $lte: toDate },
    toDate: { $gte: fromDate },
  });

  if (overlapping) {
    throw new AppError("Leave already exists in this date range", 409);
  }

  return leavesModel.create({
    user: userId,
    fromDate,
    toDate,
    type: data.type,
    isHalfDay: data.isHalfDay || false,
    reason: data.reason,
  });
};

// ---------- GET MY LEAVES ----------
export const getMyLeavesService = async (userId) => {
  return leavesModel.find({ user: userId }).sort({ createdAt: -1 });
};

// ---------- ADMIN: GET ALL LEAVES ----------
export const getAllLeavesService = async () => {
  return leavesModel
    .find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });
};

// ---------- APPROVE LEAVE ----------
export const approveLeaveService = async (leaveId, adminId) => {
  const leave = await leavesModel.findById(leaveId);
  if (!leave) throw new AppError("Leave not found", 404);

  if (leave.status !== "PENDING") {
    throw new AppError("Leave already processed", 409);
  }

  leave.status = "APPROVED";
  leave.actionBy = adminId;
  await leave.save();
  await deductForApprovedLeave(leave);
  const dates = getDateRange(leave.fromDate, leave.toDate);

  for (const date of dates) {
    const { start, end } = getISTDayRange(date);

    const isHoliday = await holidayModel.exists({
      date: { $gte: start, $lt: end },
    });

    if (isHoliday) continue;

    await attendanceModel.findOneAndUpdate(
      { user: leave.user, date: { $gte: start, $lt: end } },
      {
        status: leave.isHalfDay ? "HALF_DAY" : "LEAVE",
      },
      { upsert: true },
    );
  }

  return leave;
};

// ---------- DECLINE LEAVE ----------
export const declineLeaveService = async (leaveId, adminId) => {
  const leave = await leavesModel.findById(leaveId);
  if (!leave) throw new AppError("Leave not found", 404);

  if (leave.status !== "PENDING") {
    throw new AppError("Leave already processed", 409);
  }

  leave.status = "DECLINED";
  leave.actionBy = adminId;
  return leave.save();
};

// ---------- CANCEL LEAVE ----------
export const cancelLeaveService = async (leaveId, user) => {
  const leave = await leavesModel.findById(leaveId);
  if (!leave) throw new AppError("Leave not found", 404);

  const isOwner = leave.user.toString() === user.id;
  const isAdminOrHR = ["admin", "hr"].includes(user.role);

  // ❌ not allowed
  if (!isOwner && !isAdminOrHR) {
    throw new AppError("Not authorized to cancel this leave", 403);
  }

  // ❌ invalid states
  if (leave.status === "DECLINED")
    throw new AppError("Declined leave cannot be cancelled", 400);

  if (leave.status === "CANCELLED")
    throw new AppError("Leave already cancelled", 400);

  const now = new Date();

  const { start, end } = getISTDayRange(leave.fromDate);

  // ===== TIME RULES =====

  // Employee → only before office start (9AM)
  if (isOwner && !isAdminOrHR) {
    const officeStart = new Date(start);
    officeStart.setHours(9, 0, 0, 0);

    if (now >= officeStart) {
      throw new AppError(
        "You can cancel leave only before working hours start",
        400,
      );
    }
  }

  // HR/Admin → only until day end
  // if (isAdminOrHR) {
  //   if (now > end) {
  //     throw new AppError("Leave day has ended. Cannot cancel now", 400);
  //   }
  // }

  /* ================= LOGIC ================= */

  if (leave.status === "APPROVED") {
    await refundForCancelledLeave(leave);

    const dates = getDateRange(leave.fromDate, leave.toDate);

    for (const date of dates) {
      const { start, end } = getISTDayRange(date);

      await attendanceModel.findOneAndUpdate(
        { user: leave.user, date: { $gte: start, $lt: end } },
        { status: "ABSENT" },
      );
    }
  }

  leave.status = "CANCELLED";
  leave.actionBy = user.id;

  return leave.save();
};

// ---------- LEAVE SUMMARY ----------
export const leaveSummaryService = async (userId) => {
  const result = await leavesModel.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return result.reduce((acc, cur) => {
    acc[cur._id] = cur.count;
    return acc;
  }, {});
};
