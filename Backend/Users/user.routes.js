import express from "express";
import {
  login,
  createUser,
  getAllUsers,
  getProfile,
  updateUser,
  deleteUser,
  getEmployeeBirthdays,
  mySalaryDeduction,
  employeeSalaryDeduction,
} from "./user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const userRoutes = express.Router();

// Auth
userRoutes.post("/login", login);

// All attendance routes are protected
userRoutes.use(protect);
// Profile
userRoutes.get("/me", getProfile);
userRoutes.get("/", getAllUsers);
userRoutes.get("/birthdays", getEmployeeBirthdays);
userRoutes.get("/salary/my", mySalaryDeduction); // Employee
userRoutes.get("/salary/employee", employeeSalaryDeduction); // HR / Admin

// HR & Admin
userRoutes.post("/", createUser);
userRoutes.put("/:id", updateUser);
userRoutes.delete("/:id", deleteUser);

export default userRoutes;
