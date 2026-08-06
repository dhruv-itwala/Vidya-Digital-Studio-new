import express from "express";
import { getSettings, updateSettings } from "./SystemSettings.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", protect, roleCheck("admin", "hr", "administrative"), getSettings);
router.put("/", protect, roleCheck("admin", "hr", "administrative"), updateSettings);

export default router;
