import express from "express";
import {protect } from "../middleware/auth.middleware.js";
import * as ctrl from "./ticket.controller.js";
import { roleCheck } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", ctrl.createTicket);
router.get("/my", ctrl.getMyTickets);

// HR / Admin routes
router.use(roleCheck("admin", "hr"));
router.get("/", ctrl.getAllTickets);
router.put("/:id/status", ctrl.updateTicketStatus);

export default router;
