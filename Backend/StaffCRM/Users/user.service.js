import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "./user.model.js";
import Attendance from "../Attendance/attendance.model.js";
import Leave from "../Leaves/leave.model.js";
import Holiday from "../Holidays/holiday.model.js";
import { toISTDateKey, parseIST } from "../utils/date.utils.js";

/* ================= LOGIN ================= */
export const loginService = async (email, password) => {
  const user = await User.findOne({ email, isActive: true }).select(
    "+password",
  );
  if (!user) throw new AppError("Invalid credentials", 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError("Invalid credentials", 401);

  return user;
};

/* ================= CREATE ================= */
export const createUserService = async (data) => {
  data.password = await bcrypt.hash(data.password, 10);
  return User.create(data);
};

/* ================= UPDATE ================= */
export const updateUserService = async (loggedInUser, userId, data) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) throw new AppError("User not found", 404);

  // HR cannot modify Admin
  if (loggedInUser.role === "hr" && targetUser.role === "admin") {
    throw new AppError("HR cannot modify Admin", 403);
  }

  // Only Admin can change role
  if (loggedInUser.role !== "admin") {
    delete data.role;
  }

  // Hash password if changed
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  return User.findByIdAndUpdate(userId, data, {
    new: true,
    runValidators: true,
  }).select("-password");
};

/* ================= TOGGLE ACTIVE ================= */
export const inactiveUserService = async (loggedInUser, targetUserId) => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await User.findById(targetUserId);
  if (!user) throw new AppError("User not found", 404);

  // Prevent self toggle
  if (String(loggedInUser.id) === String(targetUserId)) {
    throw new AppError("You cannot change your own status", 403);
  }

  // HR cannot toggle Admin
  if (loggedInUser.role === "hr" && user.role === "admin") {
    throw new AppError("HR cannot modify Admin status", 403);
  }

  // Employee cannot toggle
  if (loggedInUser.role === "employee") {
    throw new AppError("Access denied", 403);
  }

  user.isActive = !user.isActive;
  await user.save();

  return user;
};

/* ================= DELETE ================= */
export const deleteUserService = async (loggedInUser, targetUserId) => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await User.findById(targetUserId);
  if (!user) throw new AppError("User not found", 404);

  // Prevent self delete
  if (String(loggedInUser.id) === String(targetUserId)) {
    throw new AppError("You cannot delete yourself", 403);
  }

  // HR cannot delete Admin
  if (loggedInUser.role === "hr" && user.role === "admin") {
    throw new AppError("HR cannot delete Admin", 403);
  }

  // Employee cannot delete
  if (loggedInUser.role === "employee") {
    throw new AppError("Access denied", 403);
  }

  await User.deleteOne({ _id: targetUserId });

  return { deletedUserId: targetUserId };
};

/* ================= BIRTHDAYS ================= */
export const getEmployeeBirthdaysService = async () => {
  return User.find({ isActive: true, dateOfBirth: { $exists: true } })
    .select("name dateOfBirth -_id")
    .sort({ dateOfBirth: 1 });
};

/* ================= USERS ================= */
export const getAllUsersService = async () => {
  const users = await User.find().select("-password").lean();

  const priority = { admin: 1, hr: 2, employee: 3 };

  return users.sort(
    (a, b) =>
      priority[a.role] - priority[b.role] || a.name.localeCompare(b.name),
  );
};

/* ================= PROFILE ================= */
export const getProfileService = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await User.findById(userId).select("-password");
  if (!user) throw new AppError("User not found", 404);

  return user;
};

/* ================= PAYROLL ================= */
export const salaryDeductionService = async (userId, from, to) => {
  const user = await User.findById(userId).select("salary");
  if (!user?.salary) {
    throw new AppError("User or salary not found", 404);
  }

  const start = parseIST(from);
  const end = parseIST(to);

  // Fetch in parallel
  const [holidays, attendance, leaves] = await Promise.all([
    Holiday.find({ date: { $gte: start, $lte: end } }),
    Attendance.find({ user: userId, date: { $gte: start, $lte: end } }),
    Leave.find({
      user: userId,
      status: "APPROVED",
      fromDate: { $lte: end },
      toDate: { $gte: start },
    }),
  ]);

  const holidaySet = new Set(holidays.map((h) => toISTDateKey(h.date)));

  const dateMap = {};
  const workingDays = [];

  for (
    let d = new Date(start);
    d <= end;
    d = new Date(d.getTime() + 86400000)
  ) {
    const day = d.getUTCDay();
    const key = toISTDateKey(d);

    // Skip weekends
    if (day === 0 || day === 6) continue;

    const isHoliday = holidaySet.has(key);

    dateMap[key] = {
      weight: 0,
      type: isHoliday ? "HOLIDAY" : "PRESENT",
    };

    workingDays.push(key);
  }

  if (!workingDays.length) {
    throw new AppError("Invalid payroll cycle", 400);
  }

  // Attendance mapping
  for (const a of attendance) {
    const key = toISTDateKey(a.date);
    if (!dateMap[key]) continue;

    if (a.status === "HALF_DAY") {
      dateMap[key].weight = 0.5;
    }
  }

  // Leave mapping
  for (const leave of leaves) {
    for (
      let d = new Date(leave.fromDate);
      d <= leave.toDate;
      d = new Date(d.getTime() + 86400000)
    ) {
      const key = toISTDateKey(d);
      if (!dateMap[key]) continue;

      if (leave.type === "UNPAID") {
        dateMap[key].weight = leave.isHalfDay ? 0.5 : 1;
      }
    }
  }

  const absentDays = Object.values(dateMap).reduce(
    (sum, d) => sum + d.weight,
    0,
  );

  const perDaySalary = user.salary / workingDays.length;
  const deduction = perDaySalary * absentDays;

  return {
    cycle: `${from} → ${to}`,
    totalWorkingDays: workingDays.length,
    absentDays,
    perDaySalary: Math.round(perDaySalary),
    deduction: Math.round(deduction),
    payableSalary: Math.round(user.salary - deduction),
    breakdown: dateMap,
  };
};
