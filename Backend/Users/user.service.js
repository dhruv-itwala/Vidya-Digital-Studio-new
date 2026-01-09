import bcrypt from "bcryptjs";
import User from "./user.model.js";

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
