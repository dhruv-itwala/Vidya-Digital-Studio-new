import express from "express";
import upload from "../../config/multer.config.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";
import {
  createClient,
  updateClient,
  getAllClients,
  getClientById,
  deleteClient,
} from "./client.controller.js";

const router = express.Router();

router.use(protect);
router.use(roleCheck("admin", "hr"));

router.post(
  "/",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  createClient,
);

router.put(
  "/:id",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  updateClient,
);

router.get("/", getAllClients);
router.get("/:id", getClientById);
router.delete("/:id", deleteClient);

export default router;
