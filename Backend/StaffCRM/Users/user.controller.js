import {
  createUserService,
  loginService,
  getAllUsersService,
  getProfileService,
  updateUserService,
  deleteUserService,
  getEmployeeBirthdaysService,
  inactiveUserService,
  getAllUsersForAdminService,
  getDashboardOverviewService,
  uploadProfilePhotoService,
} from "./user.service.js";

import { signToken } from "../utils/jwt.util.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

/* ================= AUTH ================= */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await loginService(email, password);

  const token = signToken({
    id: user._id,
    role: user.role,
  });

  res.json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/* ================= PROFILE ================= */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await getProfileService(req.user.id);

  res.json({
    success: true,
    user,
  });
});

/* ================= CREATE USER ================= */
export const createUser = asyncHandler(async (req, res) => {
  const user = await createUserService(req.body);

  res.status(201).json({
    success: true,
    message: "User created successfully",
    user,
  });
});

/* ================= UPDATE USER ================= */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await updateUserService(req.user, req.params.id, req.body);

  res.json({
    success: true,
    message: "User updated successfully",
    user,
  });
});

/* ================= TOGGLE ACTIVE ================= */
export const inactiveUser = asyncHandler(async (req, res) => {
  const user = await inactiveUserService(req.user, req.params.id);

  res.json({
    success: true,
    message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
    user,
  });
});

/* ================= DELETE USER ================= */
export const deleteUser = asyncHandler(async (req, res) => {
  const result = await deleteUserService(req.user, req.params.id);

  res.json({
    success: true,
    message: "User deleted permanently",
    deletedUserId: result.deletedUserId,
  });
});

/* ================= USERS ================= */
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await getAllUsersService();

  res.json({
    success: true,
    total: users.length,
    users,
  });
});

export const getAllUsersForAdmin = asyncHandler(async (req, res) => {
  const users = await getAllUsersForAdminService();

  res.json({
    success: true,
    total: users.length,
    users,
  });
});

/* ================= BIRTHDAYS ================= */
export const getEmployeeBirthdays = asyncHandler(async (req, res) => {
  const birthdays = await getEmployeeBirthdaysService();

  res.json({
    success: true,
    total: birthdays.length,
    birthdays,
  });
});

/* ================= DASHBOARD ================= */
export const getDashboardOverview = asyncHandler(async (req, res) => {
  const data = await getDashboardOverviewService();

  res.json({
    success: true,
    data,
  });
});

/* ================= PROFILE PHOTO ================= */
export const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const user = await uploadProfilePhotoService(req.params.id, req.file);

  res.json({
    success: true,
    message: "Profile photo updated successfully",
    profilePicture: user.profilePicture,
  });
});
