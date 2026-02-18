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
  uploadClientDocuments,
  deleteClientDocument,
} from "./client.controller.js";

const router = express.Router();

/* ===============================
   AUTH MIDDLEWARE
=============================== */
router.use(protect);
router.use(roleCheck("admin", "hr"));

/* ===============================
   CREATE CLIENT
=============================== */
router.post("/", upload.single("profilePhoto"), createClient);

/* ===============================
   UPDATE CLIENT
=============================== */
router.put("/:id", upload.single("profilePhoto"), updateClient);

/* ===============================
   UPLOAD DOCUMENTS
=============================== */
router.post(
  "/:id/documents",
  upload.array("documents", 10),
  uploadClientDocuments,
);

/* ===============================
   DELETE DOCUMENT
=============================== */
router.delete("/:clientId/documents/:documentId", deleteClientDocument);

/* ===============================
   READ
=============================== */
router.get("/", getAllClients);
router.get("/:id", getClientById);

/* ===============================
   SOFT DELETE
=============================== */
router.delete("/:id", deleteClient);

export default router;
