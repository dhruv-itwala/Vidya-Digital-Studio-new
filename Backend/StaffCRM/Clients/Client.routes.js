import express from "express";
import * as ctrl from "./client.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";
import upload from "../../config/multer.config.js";

const ClientRoutes = express.Router();

ClientRoutes.use(protect);
ClientRoutes.use(roleCheck("admin", "hr"));
/* ================= BASIC CRUD ================= */

// Create Client (with optional profile image)
ClientRoutes.post("/", upload.single("profilePhoto"), ctrl.createClient);

// Get All Clients
ClientRoutes.get("/", ctrl.getAllClients);

// Get Single Client
ClientRoutes.get("/:id", ctrl.getClientById);

// Update Client
ClientRoutes.patch("/:id", upload.single("profilePhoto"), ctrl.updateClient);

// Deactivate Client
ClientRoutes.patch(
  "/:id/deactivate",
  roleCheck("admin", "hr"),
  ctrl.deactivateClient,
);

/* ================= CREDENTIALS ================= */

ClientRoutes.post(
  "/:id/credentials",
  roleCheck("admin", "hr"),
  ctrl.addCredential,
);

ClientRoutes.patch(
  "/:id/credentials/:credId",
  roleCheck("admin", "hr"),
  ctrl.updateCredential,
);

ClientRoutes.delete(
  "/:id/credentials/:credId",
  roleCheck("admin", "hr"),
  ctrl.deleteCredential,
);

/* ================= TRANSACTIONS ================= */
ClientRoutes.post(
  "/:id/transactions",
  roleCheck("admin", "hr"),
  ctrl.addTransaction,
);
ClientRoutes.patch(
  "/:id/transactions/:txnId",
  roleCheck("admin", "hr"),
  ctrl.updateTransaction,
);
ClientRoutes.delete(
  "/:id/transactions/:txnId",
  roleCheck("admin", "hr"),
  ctrl.deleteTransaction,
);

/* ================= DOCUMENTS ================= */
ClientRoutes.post(
  "/:id/documents",
  upload.single("document"),
  ctrl.addDocument,
);

ClientRoutes.delete(
  "/:id/documents/:publicId",
  roleCheck("admin", "hr"),
  ctrl.deleteDocument,
);

export default ClientRoutes;
