// Backend/StaffCRM/AIAssistant/aiAssistant.routes.js
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  chatAssistant,
  executeConfirmedAction,
} from "./aiAssistant.controller.js";

const aiAssistantRoutes = express.Router();

// All assistant routes require a valid logged-in user
aiAssistantRoutes.use(protect);

aiAssistantRoutes.post("/chat", chatAssistant);
aiAssistantRoutes.post("/confirm", executeConfirmedAction);

export default aiAssistantRoutes;

