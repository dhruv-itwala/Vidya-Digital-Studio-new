// Backend/StaffCRM/Users/user.routes.js
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
import { roleCheck } from "../middleware/role.middleware.js";

const userRoutes = express.Router();

/* ================= AUTH ================= */
userRoutes.post("/login", login);

/* ================= PROTECTED ================= */
userRoutes.use(protect);

/* ================= PROFILE ================= */
userRoutes.get("/me", getProfile);

/* ================= USERS ================= */
userRoutes.get("/", getAllUsers);
userRoutes.get("/birthdays", getEmployeeBirthdays);

/* ================= SALARY ================= */
userRoutes.get("/salary/my", mySalaryDeduction);
userRoutes.get(
  "/salary/employee",
  roleCheck("admin", "hr"),
  employeeSalaryDeduction
);

/* ================= ADMIN ================= */
userRoutes.post("/", roleCheck("admin"), createUser);
userRoutes.put("/:id", roleCheck("admin"), updateUser);
userRoutes.delete("/:id", roleCheck("admin"), deleteUser);

export default userRoutes;
