import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "./user.model.js";
import AppError from "../utils/AppError.js";

import Lead from "../Leads/Lead.model.js";
import Client from "../Clients/Client.model.js";
import Attendance from "../Attendance/attendance.model.js";

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

  // Only Admin and HR can change role
  if (!["admin", "hr"].includes(loggedInUser.role)) {
    delete data.role;
  }

  // HR cannot assign admin role
  if (loggedInUser.role === "hr" && data.role === "admin") {
    throw new AppError("HR cannot assign admin role", 403);
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
  const users = await User.find({ isActive: true }).select("-password").lean();

  const priority = { admin: 1, hr: 2, employee: 3, intern: 4 };

  return users.sort(
    (a, b) =>
      priority[a.role] - priority[b.role] || a.name.localeCompare(b.name),
  );
};

export const getAllUsersForAdminService = async () => {
  const users = await User.find().select("-password").lean();

  const priority = { admin: 1, hr: 2, employee: 3, intern: 4 };

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

/* ================= DASHBOARD ================= */
export const getDashboardOverviewService = async () => {
  console.time("Dashboard Total Time");

  /* ================= IST DAY RANGE ================= */

  const now = new Date();

  // Convert server time → IST
  const istNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );

  const startOfDayIST = new Date(istNow);
  startOfDayIST.setHours(0, 0, 0, 0);

  const endOfDayIST = new Date(istNow);
  endOfDayIST.setHours(23, 59, 59, 999);

  // Convert IST → UTC (MongoDB uses UTC)
  const startUTC = new Date(startOfDayIST.getTime() - 5.5 * 60 * 60 * 1000);
  const endUTC = new Date(endOfDayIST.getTime() - 5.5 * 60 * 60 * 1000);

  /* ================= MONTH START (IST SAFE) ================= */

  const firstDayOfMonthIST = new Date(
    istNow.getFullYear(),
    istNow.getMonth(),
    1,
  );

  const firstDayOfMonthUTC = new Date(
    firstDayOfMonthIST.getTime() - 5.5 * 60 * 60 * 1000,
  );

  /* ================= PARALLEL BASIC COUNTS ================= */

  console.time("Parallel Counts");

  const [
    totalLeads,
    rawLeads,
    convertedLeads,
    totalClients,
    activeClients,
    totalEmployees,
  ] = await Promise.all([
    Lead.countDocuments(),
    Lead.countDocuments({ status: "Raw Lead" }),
    Lead.countDocuments({ isConverted: true }),
    Client.countDocuments(),
    Client.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: true }),
  ]);

  console.timeEnd("Parallel Counts");

  const conversionRate =
    totalLeads === 0 ? 0 : ((convertedLeads / totalLeads) * 100).toFixed(1);

  /* ================= LEAD PIPELINE ================= */

  console.time("Lead Pipeline");

  const leadPipelineAgg = await Lead.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  console.timeEnd("Lead Pipeline");

  const leadPipeline = {};

  leadPipelineAgg.forEach((item) => {
    leadPipeline[item._id] = item.count;
  });

  /* ================= TOTAL REVENUE ================= */

  console.time("Revenue Aggregation");

  const revenueAgg = await Client.aggregate([
    { $unwind: "$transactions" },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$transactions.amount" },
      },
    },
  ]);

  console.timeEnd("Revenue Aggregation");

  const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

  /* ================= MONTHLY REVENUE ================= */

  console.time("Monthly Revenue");

  const monthlyRevenueAgg = await Client.aggregate([
    { $unwind: "$transactions" },
    {
      $match: {
        "transactions.date": { $gte: firstDayOfMonthUTC },
      },
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$transactions.amount" },
      },
    },
  ]);

  console.timeEnd("Monthly Revenue");

  const monthlyRevenue = monthlyRevenueAgg[0]?.revenue || 0;

  /* ================= RECENT PAYMENTS ================= */

  console.time("Recent Payments");

  const recentPayments = await Client.aggregate([
    { $unwind: "$transactions" },
    { $sort: { "transactions.date": -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: "$transactions._id",
        clientName: 1,
        amount: "$transactions.amount",
        date: "$transactions.date",
        method: "$transactions.method",
      },
    },
  ]);

  console.timeEnd("Recent Payments");

  /* ================= ATTENDANCE ================= */

  console.time("Attendance With Users");

  const attendanceRecords = await Attendance.find({
    date: {
      $gte: startUTC,
      $lte: endUTC,
    },
  })
    .populate("user", "name")
    .lean();

  const attendance = {
    PRESENT: [],
    WFH: [],
    ABSENT: [],
    LEAVE: [],
    HALF_DAY: [],
  };

  attendanceRecords.forEach((record) => {
    const status = record.status;

    if (attendance[status] && record.user) {
      attendance[status].push({
        id: record.user._id,
        name: record.user.name,
      });
    }
  });

  console.timeEnd("Attendance With Users");

  /* ================= RECENT LEADS ================= */

  console.time("Recent Lead Activity");

  const recentLeadActivity = await Lead.find()
    .sort({ updatedAt: -1 })
    .limit(5)
    .select("clientName status updatedAt createdBy")
    .populate("createdBy", "name")
    .lean();

  console.timeEnd("Recent Lead Activity");

  console.timeEnd("Dashboard Total Time");

  return {
    leads: {
      totalLeads,
      rawLeads,
      convertedLeads,
      conversionRate,
      pipeline: leadPipeline,
    },

    clients: {
      totalClients,
      activeClients,
    },

    employees: {
      totalEmployees,
    },

    revenue: {
      totalRevenue,
      monthlyRevenue,
    },

    attendance,

    recentLeadActivity,

    recentPayments,
  };
};

/* ================= DASHBOARD ================= */
// export const getDashboardOverviewService = async () => {
//   console.time("Dashboard Total Time");

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

//   /* ================= PARALLEL BASIC COUNTS ================= */
//   console.time("Parallel Counts");

//   const [
//     totalLeads,
//     rawLeads,
//     convertedLeads,
//     totalClients,
//     activeClients,
//     totalEmployees,
//   ] = await Promise.all([
//     Lead.countDocuments(),
//     Lead.countDocuments({ status: "Raw Lead" }),
//     Lead.countDocuments({ isConverted: true }),
//     Client.countDocuments(),
//     Client.countDocuments({ isActive: true }),
//     User.countDocuments({ isActive: true }),
//   ]);

//   console.timeEnd("Parallel Counts");

//   const conversionRate =
//     totalLeads === 0 ? 0 : ((convertedLeads / totalLeads) * 100).toFixed(1);

//   /* ================= LEAD PIPELINE ================= */
//   console.time("Lead Pipeline");

//   const leadPipelineAgg = await Lead.aggregate([
//     {
//       $group: {
//         _id: "$status",
//         count: { $sum: 1 },
//       },
//     },
//   ]);

//   console.timeEnd("Lead Pipeline");

//   const leadPipeline = {};
//   leadPipelineAgg.forEach((item) => {
//     leadPipeline[item._id] = item.count;
//   });

//   /* ================= REVENUE ================= */
//   console.time("Revenue Aggregation");

//   const revenueAgg = await Client.aggregate([
//     { $unwind: "$transactions" },
//     {
//       $group: {
//         _id: null,
//         totalRevenue: { $sum: "$transactions.amount" },
//       },
//     },
//   ]);

//   console.timeEnd("Revenue Aggregation");

//   const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

//   /* ================= MONTHLY REVENUE ================= */
//   console.time("Monthly Revenue");

//   const monthlyRevenueAgg = await Client.aggregate([
//     { $unwind: "$transactions" },
//     {
//       $match: {
//         "transactions.date": { $gte: firstDayOfMonth },
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         revenue: { $sum: "$transactions.amount" },
//       },
//     },
//   ]);

//   console.timeEnd("Monthly Revenue");

//   const monthlyRevenue = monthlyRevenueAgg[0]?.revenue || 0;

//   /* ================= RECENT PAYMENTS ================= */
//   console.time("Recent Payments");

//   const recentPayments = await Client.aggregate([
//     { $unwind: "$transactions" },
//     { $sort: { "transactions.date": -1 } },
//     { $limit: 5 },
//     {
//       $project: {
//         clientName: 1,
//         amount: "$transactions.amount",
//         date: "$transactions.date",
//         method: "$transactions.method",
//       },
//     },
//   ]);

//   console.timeEnd("Recent Payments");

//   /* ================= ATTENDANCE WITH USER NAMES ================= */
//   console.time("Attendance With Users");

//   const attendanceRecords = await Attendance.find({ date: today })
//     .populate("user", "name")
//     .lean();

//   const attendance = {
//     PRESENT: [],
//     WFH: [],
//     ABSENT: [],
//     LEAVE: [],
//     HALF_DAY: [],
//   };

//   attendanceRecords.forEach((record) => {
//     const status = record.status;

//     if (attendance[status]) {
//       attendance[status].push({
//         id: record.user._id,
//         name: record.user.name,
//       });
//     }
//   });

//   console.timeEnd("Attendance With Users");

//   /* ================= RECENT LEADS ================= */
//   console.time("Recent Lead Activity");

//   const recentLeadActivity = await Lead.find()
//     .sort({ updatedAt: -1 })
//     .limit(5)
//     .select("clientName status updatedAt createdBy")
//     .populate("createdBy", "name")
//     .lean();

//   console.timeEnd("Recent Lead Activity");

//   console.timeEnd("Dashboard Total Time");

//   return {
//     leads: {
//       totalLeads,
//       rawLeads,
//       convertedLeads,
//       conversionRate,
//       pipeline: leadPipeline,
//     },

//     clients: {
//       totalClients,
//       activeClients,
//     },

//     employees: {
//       totalEmployees,
//     },

//     revenue: {
//       totalRevenue,
//       monthlyRevenue,
//     },

//     attendance,

//     recentLeadActivity,

//     recentPayments,
//   };
// };
