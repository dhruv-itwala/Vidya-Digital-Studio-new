import express from "express";
import * as ctrl from "./lead.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck, roleOrPermissionCheck } from "../middleware/role.middleware.js";

const LeadsRoutes = express.Router();

LeadsRoutes.use(protect);

LeadsRoutes.use(roleOrPermissionCheck(["admin", "hr"], "leads_manage"));

/* ================= BASIC CRUD ================= */

// Create Lead
LeadsRoutes.post("/", ctrl.createLead);

// Get All Leads (with filters)
LeadsRoutes.get("/", ctrl.getAllLeads);

// Get Single Lead
LeadsRoutes.get("/:id", ctrl.getLeadById);

// Update Lead
LeadsRoutes.patch("/:id", ctrl.updateLead);

LeadsRoutes.delete("/:id", roleOrPermissionCheck(["admin", "hr"], "leads_manage"), ctrl.deleteLead);

/* ================= MEETING NOTES ================= */

LeadsRoutes.post("/:id/meeting-note", ctrl.addMeetingNote);

/* ================= STATUS UPDATE ================= */

LeadsRoutes.patch("/:id/status", ctrl.updateLeadStatus);

/* ================= PROPOSAL UPDATE ================= */

LeadsRoutes.patch("/:id/proposal", ctrl.updateLeadProposal);

/* ================= CONVERT TO CLIENT ================= */

LeadsRoutes.post("/:id/convert", roleOrPermissionCheck(["admin", "hr"], "leads_manage"), ctrl.convertLead);

export default LeadsRoutes;
