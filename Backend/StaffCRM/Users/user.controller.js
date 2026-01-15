// Backend/StaffCRM/Users/user.controller.js
import {
  createUserService,
  loginService,
  getAllUsersService,
  getProfileService,
  updateUserService,
  deleteUserService,
  getEmployeeBirthdaysService,
  salaryDeductionService,
} from "./user.service.js";
import { signToken } from "../utils/jwt.util.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

/* ================= AUTH ================= */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError("Email and password required", 400);
  }

  const user = await loginService(email, password);

  const token = signToken({ id: user._id, role: user.role });

  res.json({
    success: true,
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
  res.json({ success: true, user });
});

/* ================= USER CRUD ================= */
export const createUser = asyncHandler(async (req, res) => {
  const user = await createUserService(req.body);
  res.status(201).json({ success: true, user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await updateUserService(req.user, req.params.id, req.body);
  res.json({ success: true, user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  await deleteUserService(req.user, req.params.id);
  res.json({ success: true, message: "User deleted successfully" });
});

/* ================= USERS ================= */
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await getAllUsersService();
  res.json({ success: true, users });
});

export const getEmployeeBirthdays = asyncHandler(async (req, res) => {
  const birthdays = await getEmployeeBirthdaysService();
  res.json({ success: true, birthdays });
});

/* ================= SALARY ================= */
export const mySalaryDeduction = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    throw new AppError("from and to are required", 400);
  }

  const data = await salaryDeductionService(req.user.id, from, to);

  res.json({
    success: true,
    user: req.user.id,
    ...data,
  });
});

export const employeeSalaryDeduction = asyncHandler(async (req, res) => {
  const { userId, from, to } = req.query;
  if (!userId || !from || !to) {
    throw new AppError("userId, from, to are required", 400);
  }

  const data = await salaryDeductionService(userId, from, to);

  res.json({
    success: true,
    user: userId,
    ...data,
  });
});
