import express from "express";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "./Announcement.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";

const router = express.Router();

// Everyone can view active announcements
router.get("/", protect, getAnnouncements);

// Only admin/administrative/hr can create/delete
router.post(
  "/",
  protect,
  roleCheck("admin", "hr", "administrative"),
  createAnnouncement
);

router.delete(
  "/:id",
  protect,
  roleCheck("admin", "hr", "administrative"),
  deleteAnnouncement
);

export default router;
