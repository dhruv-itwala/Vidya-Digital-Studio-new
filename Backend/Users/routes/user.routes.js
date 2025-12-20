import express from "express";
import {
  login,
  createUser,
  getAllUsers,
  getProfile,
  updateProfile,
  updateUser,
} from "../controllers/user.controller.js";
import { protect, adminOnly } from "../../middleware/auth.middleware.js";

const userRoutes = express.Router();

// Auth
userRoutes.post("/login", login);

// Profile
userRoutes.get("/me", protect, getProfile);
userRoutes.put("/me", protect, updateProfile);

// Admin
userRoutes.post("/", protect, adminOnly, createUser);
// Admin routes
userRoutes.put("/:id", protect, adminOnly, updateUser); // NEW

userRoutes.get("/", protect, getAllUsers);

export default userRoutes;
