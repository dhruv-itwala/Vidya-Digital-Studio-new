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

// Toggle Client Status (Active/Inactive)
ClientRoutes.patch("/:id/toggle", ctrl.toggleClientStatus);

// Delete Client
ClientRoutes.delete("/:id", ctrl.deleteClient);

/* ================= CREDENTIALS ================= */

ClientRoutes.post(
  "/:id/credentials",

  ctrl.addCredential,
);

ClientRoutes.patch(
  "/:id/credentials/:credId",

  ctrl.updateCredential,
);

ClientRoutes.delete(
  "/:id/credentials/:credId",

  ctrl.deleteCredential,
);

/* ================= TRANSACTIONS ================= */
ClientRoutes.post(
  "/:id/transactions",

  ctrl.addTransaction,
);
ClientRoutes.patch(
  "/:id/transactions/:txnId",

  ctrl.updateTransaction,
);
ClientRoutes.delete(
  "/:id/transactions/:txnId",

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

  ctrl.deleteDocument,
);

export default ClientRoutes;
