import bcrypt from "bcryptjs";
import User from "./user.model.js";
import Attendance from "../Attendance/attendance.model.js";
import Leave from "../Leaves/leave.model.js";
import Holiday from "../Holidays/holiday.model.js";
import { toISTDateKey, parseIST } from "../utils/date.utils.js";

// Login service
export const loginService = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  return user;
};

// Create new user
export const createUserService = async (data) => {
  if (await User.findOne({ email: data.email }))
    throw new Error("User already exists");

  data.password = await bcrypt.hash(data.password, 10);
  return User.create(data);
};

// Update user with role-based restrictions
export const updateUserService = async (loggedInUser, userId, data) => {
  const targetUser = await User.findById(userId);
  if (!targetUser) throw new Error("User not found");

  // HR cannot update Admin
  if (loggedInUser.role === "hr" && targetUser.role === "admin") {
    throw new Error("HR cannot modify Admin");
  }

  // Only Admin can change roles
  if (loggedInUser.role !== "admin") {
    delete data.role;
  }

  // Password update (same route)
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  return User.findByIdAndUpdate(userId, data, {
    new: true,
    runValidators: true,
  }).select("-password");
};

// Soft delete user
export const deleteUserService = async (loggedInUser, targetUserId) => {
  const user = await User.findById(targetUserId);
  if (!user) throw new Error("User not found");

  // HR cannot delete Admin
  if (loggedInUser.role === "hr" && user.role === "admin") {
    throw new Error("HR cannot delete Admin");
  }

  // Employee cannot delete anyone
  if (loggedInUser.role === "employee") {
    throw new Error("Access denied");
  }

  // Soft delete
  user.isActive = false;
  await user.save();
};

// Get all active employees with birthdays
export const getEmployeeBirthdaysService = async () => {
  return User.find({
    isActive: true,
    dateOfBirth: { $exists: true },
  })
    .select("name dateOfBirth -_id")
    .sort({ dateOfBirth: 1 });
};

// Get all active users sorted by role: Admin > HR > Employee
export const getAllUsersService = async () => {
  const users = await User.find({ isActive: true }).select("-password");

  const rolePriority = {
    admin: 1,
    hr: 2,
    employee: 3,
  };

  return users.sort((a, b) => {
    const roleDiff = rolePriority[a.role] - rolePriority[b.role];

    if (roleDiff !== 0) return roleDiff;

    // Optional: sort by name inside same role
    return a.name.localeCompare(b.name);
  });
};

export const getProfileService = async (userId) => {
  return User.findById(userId).select("-password");
};

export const salaryDeductionService = async (userId, from, to) => {
  const user = await User.findById(userId);
  if (!user || !user.salary) throw new Error("User or salary not found");

  const start = parseIST(from); // 11th
  const end = parseIST(to); // 10th

  // -------------------------
  // 1️⃣ Load Holidays
  // -------------------------
  const holidays = await Holiday.find({
    date: { $gte: start, $lte: end },
  });

  const holidaySet = new Set(holidays.map((h) => toISTDateKey(h.date)));

  // -------------------------
  // 2️⃣ Build Payroll Calendar
  // -------------------------
  const dateMap = {};
  const workingDays = [];

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.getUTCDay(); // IST weekday
    const dateKey = toISTDateKey(d);

    if (day === 0 || day === 6) continue; // weekend

    // Paid holiday
    if (holidaySet.has(dateKey)) {
      dateMap[dateKey] = { weight: 0, type: "HOLIDAY" };
      workingDays.push(dateKey);
      continue;
    }

    // dateMap[dateKey] = { weight: 1, type: "ABSENT" };
    dateMap[dateKey] = { weight: 0, type: "PRESENT" };

    workingDays.push(dateKey);
  }

  const totalWorkingDays = workingDays.length;

  // -------------------------
  // 3️⃣ Attendance
  // -------------------------
  const attendance = await Attendance.find({
    user: userId,
    date: { $gte: start, $lte: end },
  });

  for (const a of attendance) {
    const key = toISTDateKey(a.date);
    if (!dateMap[key]) continue;

    if (["PRESENT", "WFH"].includes(a.status)) dateMap[key].weight = 0;
    if (a.status === "HALF_DAY") dateMap[key].weight = 0.5;
    if (a.status === "HOLIDAY") dateMap[key].weight = 0;
  }

  // -------------------------
  // 4️⃣ Approved Leaves
  // -------------------------
  const leaves = await Leave.find({
    user: userId,
    status: "APPROVED",
    fromDate: { $lte: end },
    toDate: { $gte: start },
  });

  for (const leave of leaves) {
    for (
      let d = new Date(leave.fromDate);
      d <= leave.toDate;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const key = toISTDateKey(d);
      if (!dateMap[key]) continue;

      if (leave.type === "CASUAL" || leave.type === "SICK") {
        dateMap[key].weight = 0; // paid
      }

      if (leave.type === "UNPAID") {
        dateMap[key].weight = leave.isHalfDay ? 0.5 : 1;
      }
    }
  }

  // -------------------------
  // 5️⃣ Calculate
  // -------------------------
  let absentDays = 0;
  Object.values(dateMap).forEach((d) => (absentDays += d.weight));

  const perDaySalary = user.salary / totalWorkingDays;
  const deduction = perDaySalary * absentDays;

  return {
    cycle: `${from} → ${to}`,
    totalWorkingDays,
    absentDays,
    perDaySalary: Math.round(perDaySalary),
    deduction: Math.round(deduction),
    payableSalary: Math.round(user.salary - deduction),
    breakdown: dateMap,
  };
};
