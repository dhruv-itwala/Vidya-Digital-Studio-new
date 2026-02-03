import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";
import upload from "../../config/multer.config.js";
import {
  createClient,
  updateClient,
  getAllClients,
  getClientById,
  deleteClient,
  updateClientProfilePhoto,
} from "./client.controller.js";

const router = express.Router();

// router.use(protect);
// router.use(roleCheck("admin", "hr"));

// ✅ Enable image upload
router.post("/", upload.single("profilePhoto"), createClient);

router.post("/:id", upload.single("profilePhoto"), updateClient);

router.post("/:id/profile-photo", updateClientProfilePhoto);

// ❌ No Multer for read-only routes
router.get("/", getAllClients);
router.get("/:id", getClientById);
router.delete("/:id", deleteClient);

export default router;
