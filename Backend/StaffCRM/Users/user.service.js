// Backend/StaffCRM/Users/user.service.js
import bcrypt from "bcryptjs";
import User from "./user.model.js";
import Attendance from "../Attendance/attendance.model.js";
import Leave from "../Leaves/leave.model.js";
import Holiday from "../Holidays/holiday.model.js";
import { toISTDateKey, parseIST } from "../utils/date.utils.js";
import mongoose from "mongoose";

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
  return User.create(data); // rely on unique index + error middleware
};

/* ================= UPDATE ================= */
export const updateUserService = async (loggedInUser, userId, data) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) throw new AppError("User not found", 404);

  if (loggedInUser.role === "hr" && targetUser.role === "admin") {
    throw new AppError("HR cannot modify Admin", 403);
  }

  if (loggedInUser.role !== "admin") {
    delete data.role;
  }

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  return User.findByIdAndUpdate(userId, data, {
    new: true,
    runValidators: true,
  }).select("-password");
};

/* ================= DELETE ================= */
export const deleteUserService = async (loggedInUser, targetUserId) => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await User.findById(targetUserId);
  if (!user) throw new AppError("User not found", 404);

  if (loggedInUser.role === "hr" && user.role === "admin") {
    throw new AppError("HR cannot delete Admin", 403);
  }

  if (loggedInUser.role === "employee") {
    throw new AppError("Access denied", 403);
  }

  user.isActive = false;
  await user.save();
};

// ================= Birthday  ================= */
export const getEmployeeBirthdaysService = async () => {
  return User.find({
    isActive: true,
    dateOfBirth: { $exists: true },
  })
    .select("name dateOfBirth -_id")
    .sort({ dateOfBirth: 1 });
};

/* ================= USERS ================= */
export const getAllUsersService = async () => {
  return User.find()
    .select("-password")
    .lean()
    .then((users) =>
      users.sort((a, b) => {
        const priority = { admin: 1, hr: 2, employee: 3 };
        return (
          priority[a.role] - priority[b.role] || a.name.localeCompare(b.name)
        );
      }),
    );
};

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
  const user = await User.findById(userId);
  if (!user || !user.salary) {
    throw new AppError("User or salary not found", 404);
  }

  const start = parseIST(from);
  const end = parseIST(to);

  const holidays = await Holiday.find({ date: { $gte: start, $lte: end } });
  const holidaySet = new Set(holidays.map((h) => toISTDateKey(h.date)));

  const dateMap = {};
  const workingDays = [];

  for (
    let d = new Date(start);
    d.getTime() <= end.getTime();
    d = new Date(d.getTime() + 86400000)
  ) {
    const day = d.getUTCDay();
    const key = toISTDateKey(d);

    if (day === 0 || day === 6) continue;

    dateMap[key] = {
      weight: holidaySet.has(key) ? 0 : 0,
      type: holidaySet.has(key) ? "HOLIDAY" : "PRESENT",
    };

    workingDays.push(key);
  }

  if (!workingDays.length) {
    throw new AppError("Invalid payroll cycle", 400);
  }

  const attendance = await Attendance.find({
    user: userId,
    date: { $gte: start, $lte: end },
  });

  attendance.forEach((a) => {
    const key = toISTDateKey(a.date);
    if (!dateMap[key]) return;

    if (a.status === "HALF_DAY") dateMap[key].weight = 0.5;
  });

  const leaves = await Leave.find({
    user: userId,
    status: "APPROVED",
    fromDate: { $lte: end },
    toDate: { $gte: start },
  });

  leaves.forEach((leave) => {
    for (
      let d = new Date(leave.fromDate);
      d.getTime() <= leave.toDate.getTime();
      d = new Date(d.getTime() + 86400000)
    ) {
      const key = toISTDateKey(d);
      if (!dateMap[key]) continue;

      if (leave.type === "UNPAID") {
        dateMap[key].weight = leave.isHalfDay ? 0.5 : 1;
      }
    }
  });

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
