import mongoose from "mongoose";
import leavesModel from "./leave.model.js";
import holidayModel from "../Holidays/holiday.model.js";
import attendanceModel from "../Attendance/attendance.model.js";
import AppError from "../utils/AppError.js";
import { getISTDayRange, normalizeDate } from "../utils/date.utils.js";
import {
  notifyLeaveApplied,
  notifyLeaveApproved,
  notifyLeaveCancelled,
} from "../Notifications/notificationEvent.service.js";
import User from "../Users/user.model.js";


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
  const holiday = await holidayModel.exists({
    date: { $gte: fromDate, $lte: toDate },
  });

  if (holiday) {
    throw new AppError("Leave range contains a holiday", 409);
  }

  // ❌ Overlapping leave check
  const overlapping = await leavesModel.exists({
    user: userId,
    status: { $in: ["PENDING", "APPROVED"] },
    fromDate: { $lte: toDate },
    toDate: { $gte: fromDate },
  });

  if (overlapping) {
    throw new AppError("Leave already exists in this date range", 409);
  }

  // ❌ Balance check
  const requestedDays = data.isHalfDay ? 0.5 : getDateRange(fromDate, toDate).length;
  const user = await User.findById(userId);
  const nowIST = new Date(new Date().getTime() + (330 * 60000));
  const targetYear = fromDate.getFullYear();
  const balance = await calculateLeaveBalance(user, targetYear, true); // Include pending for applying

  if (balance.pending < requestedDays) {
    throw new AppError(`Insufficient total leave balance. You have ${balance.pending} days left.`, 400);
  }

  const typeLower = data.type.toLowerCase();
  const quota = balance.quotas[typeLower];
  const taken = balance.taken[typeLower];
  const availableForType = quota - taken;

  if (availableForType < requestedDays) {
    throw new AppError(`Insufficient ${data.type} leave balance. You have ${availableForType} days left for this type.`, 400);
  }

  const leave = await leavesModel.create({
    user: userId,
    fromDate,
    toDate,
    type: data.type,
    isHalfDay: data.isHalfDay || false,
    reason: data.reason,
  });

  notifyLeaveApplied(leave, userId);
  return leave;
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

  notifyLeaveApproved(leave);
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
  await leave.save();

  notifyLeaveDeclined(leave);
  return leave;
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

  await leave.save();

  notifyLeaveCancelled(leave, user.id);
  return leave;
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

// ---------- LEAVE BALANCE CALCULATION HELPER ----------
const getActiveMonthsInYearUpToMonth = (year, upToMonthIndex, joiningDate) => {
  const joinY = joiningDate.getFullYear();
  const joinM = joiningDate.getMonth();
  if (year < joinY) return 0;
  const startM = (year === joinY) ? joinM : 0;
  const endM = upToMonthIndex; // 0 to 11
  if (startM > endM) return 0;
  return (endM - startM) + 1;
};

// Helper to get taken leaves for a specific year and user
const getTakenLeavesForYear = async (userId, year, includePending = false) => {
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  const statuses = includePending ? ["APPROVED", "PENDING"] : ["APPROVED"];

  const leaves = await leavesModel.find({
    user: userId,
    status: { $in: statuses },
    fromDate: { $lte: endOfYear },
    toDate: { $gte: startOfYear },
  });

  let sick = 0;
  let casual = 0;
  let earned = 0;
  let halfDays = 0;

  for (const leave of leaves) {
    // Only count days that fall within this year
    const overlapStart = leave.fromDate < startOfYear ? startOfYear : leave.fromDate;
    const overlapEnd = leave.toDate > endOfYear ? endOfYear : leave.toDate;
    
    if (overlapStart > overlapEnd) continue;

    const dates = getDateRange(overlapStart, overlapEnd);
    let count = leave.isHalfDay ? 0.5 : 1;

    for (const date of dates) {
      if (leave.isHalfDay) {
        halfDays += 1;
      }
      if (leave.type === "SICK") sick += count;
      if (leave.type === "CASUAL") casual += count;
      if (leave.type === "EARNED") earned += count;
    }
  }

  return { sick, casual, earned, halfDays, total: sick + casual + earned };
};

export const calculateLeaveBalance = async (user, targetYear, includePending = false) => {
  const joiningDate = new Date(user.joiningDate);
  const startYear = Math.max(2026, joiningDate.getFullYear()); // Start from 2026 or joining year
  
  let carryForward = 0;
  
  // Calculate sequentially from startYear to targetYear - 1 to get carryForward
  for (let y = startYear; y < targetYear; y++) {
    const monthsActive = getActiveMonthsInYearUpToMonth(y, 11, joiningDate);
    const accrued = monthsActive * 2;
    
    const takenInY = await getTakenLeavesForYear(user._id, y, false); // Carry forward based on APPROVED only
    const totalAvailable = accrued + carryForward;
    const unused = Math.max(0, totalAvailable - takenInY.total);
    
    carryForward = Math.min(unused, 10);
  }
  
  // Target year
  const now = new Date();
  const istTime = now.getTime() + (330 * 60000);
  const nowIST = new Date(istTime);
  const currentMonth = nowIST.getUTCMonth();
  const currentYear = nowIST.getUTCFullYear();
  
  let monthsActiveTarget = 0;
  if (targetYear < startYear) {
    monthsActiveTarget = 0;
  } else if (targetYear === currentYear) {
    monthsActiveTarget = getActiveMonthsInYearUpToMonth(targetYear, currentMonth, joiningDate);
  } else {
    monthsActiveTarget = getActiveMonthsInYearUpToMonth(targetYear, 11, joiningDate);
  }
  
  const accruedThisYear = monthsActiveTarget * 2;
  const takenThisYear = await getTakenLeavesForYear(user._id, targetYear, includePending);
  
  const totalAccrued = accruedThisYear + carryForward;
  const pendingTotal = Math.max(0, totalAccrued - takenThisYear.total);
  
  return {
    year: targetYear,
    carryForward,
    accruedThisYear,
    totalAccrued,
    taken: takenThisYear,
    pending: pendingTotal,
    quotas: {
      sick: 7,
      casual: 7,
      earned: 10 + carryForward
    }
  };
};

// ---------- GET USER LEAVE BALANCE ----------
export const getLeaveBalanceService = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  const now = new Date();
  const istTime = now.getTime() + (330 * 60000);
  const currentYear = new Date(istTime).getUTCFullYear();

  const balance = await calculateLeaveBalance(user, currentYear, false);
  
  return {
    year: balance.year,
    accrued: {
      total: balance.totalAccrued,
      sick: balance.quotas.sick,
      casual: balance.quotas.casual,
      earned: balance.quotas.earned,
    },
    taken: {
      sick: balance.taken.sick,
      casual: balance.taken.casual,
      earned: balance.taken.earned,
      halfDays: balance.taken.halfDays,
      total: balance.taken.total
    },
    carryForward: balance.carryForward,
    pending: balance.pending
  };
};

// ---------- LEAVE ANALYTICS ----------
export const allUsersLeaveAnalyticsService = async () => {
  const users = await User.find({ isActive: true }).select("name email joiningDate");
  const result = [];

  const now = new Date();
  const istTime = now.getTime() + (330 * 60000);
  const currentYear = new Date(istTime).getUTCFullYear();

  for (const user of users) {
    const balance = await calculateLeaveBalance(user, currentYear, false);
    result.push({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      taken: balance.taken,
      summary: {
        totalAllowed: balance.totalAccrued,
        used: balance.taken.total,
        remaining: balance.pending,
        carryForward: balance.carryForward
      }
    });
  }

  return result;
};
