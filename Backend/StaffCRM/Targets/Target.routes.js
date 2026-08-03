import express from "express";
import {
  getMyTargets,
  setTarget,
  getUserTargets,
} from "./Target.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/my-targets", protect, getMyTargets);

// Admins / HR / Administrative can view and set targets
router.post("/", protect, roleCheck("admin", "hr", "administrative"), setTarget);
router.get("/:userId", protect, roleCheck("admin", "hr", "administrative"), getUserTargets);

export default router;
