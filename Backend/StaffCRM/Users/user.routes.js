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
  inactiveUser,
  getAllUsersForAdmin,
  getDashboardOverview,
  uploadProfilePhoto,
} from "./user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";
import upload from "../../config/multer.config.js";
import { apiLogger } from "../../logger/logger.middleware.js";

const userRoutes = express.Router();

/* ================= AUTH ================= */
userRoutes.post("/login", login);

userRoutes.use(protect);
userRoutes.use(apiLogger);

userRoutes.get("/me", getProfile);
userRoutes.get("/", getAllUsers);
userRoutes.get("/birthdays", getEmployeeBirthdays);

userRoutes.get("/dashboard", getDashboardOverview);

userRoutes.post(
  "/:id/upload-profile-photo",
  roleCheck("admin", "hr"),
  upload.single("profile"),
  uploadProfilePhoto,
);

userRoutes.get("/admin/all", roleCheck("admin", "hr"), getAllUsersForAdmin);
userRoutes.post("/", roleCheck("admin", "hr"), createUser);
userRoutes.put("/:id", roleCheck("admin", "hr"), updateUser);
userRoutes.patch("/:id/inactive", roleCheck("admin", "hr"), inactiveUser);
userRoutes.delete("/:id", roleCheck("admin", "hr"), deleteUser);

export default userRoutes;
