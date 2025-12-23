import express from "express";
import {
  login,
  createUser,
  getAllUsers,
  getProfile,
  updateUser,
  deleteUser,
} from "./user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const userRoutes = express.Router();

// Auth
userRoutes.post("/login", login);

// All attendance routes are protected
userRoutes.use(protect);
// Profile
userRoutes.get("/me", getProfile);

// HR & Admin
userRoutes.post("/", createUser);
userRoutes.put("/:id", updateUser);
userRoutes.delete("/:id", deleteUser);

// Admin only
userRoutes.get("/", getAllUsers);

export default userRoutes;
