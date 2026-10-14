import express from "express";
import {
  verifyWebhook,
  receiveMessage,
  getConversations,
  getConversationMessages,
  sendManualMessage,
} from "./whatsapp.controller.js";
import { protect } from "../StaffCRM/middleware/auth.middleware.js";
import { roleCheck } from "../StaffCRM/middleware/role.middleware.js";

const whatsappRoutes = express.Router();

// Webhook
whatsappRoutes.get("/webhook", verifyWebhook);
whatsappRoutes.post("/webhook", receiveMessage);

// Conversation History & Chat Management (Admin, HR, Administrative)
whatsappRoutes.get("/conversations", protect, roleCheck("admin", "hr"), getConversations);
whatsappRoutes.get("/conversations/:phone/messages", protect, roleCheck("admin", "hr"), getConversationMessages);
whatsappRoutes.post("/conversations/:phone/send", protect, roleCheck("admin", "hr"), sendManualMessage);

export default whatsappRoutes;
