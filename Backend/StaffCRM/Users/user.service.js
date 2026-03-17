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
  /* ================= IST DAY RANGE ================= */

  const now = new Date();

  const istNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );

  const startOfDayIST = new Date(istNow);
  startOfDayIST.setHours(0, 0, 0, 0);

  const endOfDayIST = new Date(istNow);
  endOfDayIST.setHours(23, 59, 59, 999);

  const startUTC = new Date(startOfDayIST.getTime() - 5.5 * 60 * 60 * 1000);
  const endUTC = new Date(endOfDayIST.getTime() - 5.5 * 60 * 60 * 1000);

  /* ================= MONTH START ================= */

  const firstDayOfMonthIST = new Date(
    istNow.getFullYear(),
    istNow.getMonth(),
    1,
  );

  const firstDayOfMonthUTC = new Date(
    firstDayOfMonthIST.getTime() - 5.5 * 60 * 60 * 1000,
  );

  /* ================= PARALLEL QUERIES ================= */

  const [
    totalLeads,
    rawLeads,
    convertedLeads,
    totalClients,
    activeClients,
    totalEmployees,

    leadPipelineAgg,

    revenueAgg,

    monthlyRevenueAgg,

    recentPayments,

    attendanceRecords,

    recentLeadActivity,

    upcomingMeetings,
  ] = await Promise.all([
    /* ===== COUNTS ===== */

    Lead.countDocuments(),
    Lead.countDocuments({ status: "Raw Lead" }),
    Lead.countDocuments({ isConverted: true }),

    Client.countDocuments(),
    Client.countDocuments({ isActive: true }),

    User.countDocuments({ isActive: true }),

    /* ===== LEAD PIPELINE ===== */

    Lead.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    /* ===== TOTAL REVENUE ===== */

    Client.aggregate([
      { $unwind: "$transactions" },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$transactions.amount" },
        },
      },
    ]),

    /* ===== MONTHLY REVENUE ===== */

    Client.aggregate([
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
    ]),

    /* ===== RECENT PAYMENTS ===== */

    Client.aggregate([
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
    ]),

    /* ===== ATTENDANCE ===== */

    Attendance.find({
      date: {
        $gte: startUTC,
        $lte: endUTC,
      },
    })
      .populate("user", "name")
      .lean(),

    /* ===== RECENT LEAD ACTIVITY ===== */

    Lead.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("clientName ownerName status updatedAt createdBy")
      .populate("createdBy", "name")
      .lean(),

    /* ===== UPCOMING MEETINGS ===== */

    Lead.aggregate([
      { $unwind: "$meetingNotes" },
      {
        $match: {
          "meetingNotes.date": { $gte: startUTC },
        },
      },
      {
        $sort: {
          "meetingNotes.date": 1,
        },
      },
      { $limit: 10 },
      {
        $project: {
          leadId: "$_id",
          clientName: 1,
          ownerName: 1,
          status: 1,
          proposal: 1,
          meetingDate: "$meetingNotes.date",
          note: "$meetingNotes.note",
        },
      },
    ]),
  ]);

  /* ================= CALCULATIONS ================= */

  const conversionRate =
    totalLeads === 0 ? 0 : ((convertedLeads / totalLeads) * 100).toFixed(1);

  const leadPipeline = {};
  leadPipelineAgg.forEach((item) => {
    leadPipeline[item._id] = item.count;
  });

  const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
  const monthlyRevenue = monthlyRevenueAgg[0]?.revenue || 0;

  /* ================= ATTENDANCE FORMAT ================= */

  const attendance = {
    PRESENT: [],
    WFH: [],
    ABSENT: [],
    LEAVE: [],
    HALF_DAY: [],
  };

  attendanceRecords.forEach((record) => {
    if (attendance[record.status] && record.user) {
      attendance[record.status].push({
        id: record.user._id,
        name: record.user.name,
      });
    }
  });

  /* ================= RETURN ================= */

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

    upcomingMeetings,
  };
};
