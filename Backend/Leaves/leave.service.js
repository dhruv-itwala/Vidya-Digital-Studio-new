import mongoose from "mongoose";
import leavesModel from "./leave.model.js";
import holidayModel from "../Holidays/holiday.model.js";
import attendanceModel from "../Attendance/attendance.model.js";

// ---------- HELPERS ----------
const normalizeDate = (date) => new Date(new Date(date).setHours(0, 0, 0, 0));

const getDateRange = (from, to) => {
  const dates = [];
  let current = new Date(from);

  while (current <= to) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

// ---------- APPLY LEAVE ----------
export const applyLeaveService = async (userId, data) => {
  const fromDate = normalizeDate(data.fromDate);
  const toDate = normalizeDate(data.toDate);

  if (fromDate > toDate) {
    throw new Error("From date cannot be after to date");
  }

  if (data.isHalfDay && fromDate.getTime() !== toDate.getTime()) {
    throw new Error("Half-day leave must be for a single day");
  }

  // ❌ Holiday check
  const holiday = await holidayModel.findOne({
    date: { $gte: fromDate, $lte: toDate },
  });
  if (holiday) {
    throw new Error("Leave range contains holiday");
  }

  // ❌ Overlapping leave check
  const overlapping = await leavesModel.findOne({
    user: userId,
    status: { $in: ["PENDING", "APPROVED"] },
    fromDate: { $lte: toDate },
    toDate: { $gte: fromDate },
  });

  if (overlapping) {
    throw new Error("Leave already exists in this date range");
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
export const getMyLeavesService = (userId) => {
  return leavesModel.find({ user: userId }).sort({ createdAt: -1 });
};

// ---------- ADMIN: ALL LEAVES ----------
export const getAllLeavesService = () => {
  return leavesModel
    .find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });
};

// ---------- APPROVE LEAVE ----------
export const approveLeaveService = async (leaveId, adminId) => {
  const leave = await leavesModel.findById(leaveId);
  if (!leave) throw new Error("Leave not found");

  if (leave.status !== "PENDING") {
    throw new Error("Leave already processed");
  }

  leave.status = "APPROVED";
  leave.actionBy = adminId;
  await leave.save();

  const dates = getDateRange(leave.fromDate, leave.toDate);

  for (const date of dates) {
    const isHoliday = await holidayModel.exists({ date });
    if (isHoliday) continue;

    await attendanceModel.findOneAndUpdate(
      { user: leave.user, date },
      {
        status: leave.isHalfDay ? "HALF_DAY" : "LEAVE",
      },
      { upsert: true }
    );
  }

  return leave;
};

// ---------- DECLINE LEAVE ----------
export const declineLeaveService = async (leaveId, adminId) => {
  const leave = await leavesModel.findById(leaveId);
  if (!leave) throw new Error("Leave not found");

  if (leave.status !== "PENDING") {
    throw new Error("Leave already processed");
  }

  leave.status = "DECLINED";
  leave.actionBy = adminId;
  return leave.save();
};

// ---------- CANCEL LEAVE ----------
export const cancelLeaveService = async (leaveId, userId) => {
  const leave = await leavesModel.findOne({ _id: leaveId, user: userId });
  if (!leave) throw new Error("Leave not found");

  if (leave.status === "DECLINED") {
    throw new Error("Declined leave cannot be cancelled");
  }

  // revert attendance if approved
  if (leave.status === "APPROVED") {
    const dates = getDateRange(leave.fromDate, leave.toDate);

    for (const date of dates) {
      await attendanceModel.findOneAndUpdate(
        { user: userId, date },
        { status: "ABSENT" }
      );
    }
  }

  leave.status = "CANCELLED";
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
