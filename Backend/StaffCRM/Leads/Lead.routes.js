import express from "express";
import * as ctrl from "./lead.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";
import { apiLogger } from "../../logger/logger.middleware.js";

const LeadsRoutes = express.Router();

LeadsRoutes.use(protect);
LeadsRoutes.use(apiLogger);
LeadsRoutes.use(roleCheck("admin", "hr"));

/* ================= BASIC CRUD ================= */

// Create Lead
LeadsRoutes.post("/", ctrl.createLead);

// Get All Leads (with filters)
LeadsRoutes.get("/", ctrl.getAllLeads);

// Get Single Lead
LeadsRoutes.get("/:id", ctrl.getLeadById);

// Update Lead
LeadsRoutes.patch("/:id", ctrl.updateLead);

// Delete Lead
LeadsRoutes.delete("/:id", roleCheck("admin", "hr"), ctrl.deleteLead);

/* ================= MEETING NOTES ================= */

LeadsRoutes.post("/:id/meeting-note", ctrl.addMeetingNote);

/* ================= STATUS UPDATE ================= */

LeadsRoutes.patch("/:id/status", ctrl.updateLeadStatus);

/* ================= PROPOSAL UPDATE ================= */

LeadsRoutes.patch("/:id/proposal", ctrl.updateLeadProposal);

/* ================= CONVERT TO CLIENT ================= */

LeadsRoutes.post("/:id/convert", roleCheck("admin", "hr"), ctrl.convertLead);

export default LeadsRoutes;
