import express from "express";
import { verifyWebhook, receiveMessage } from "./whatsapp.controller.js";
import { apiLogger } from "../logger/logger.middleware.js";
import { testWhatsApp } from "./whatsapp.sender.js";

const whatsappRoutes = express.Router();
whatsappRoutes.use(apiLogger);

whatsappRoutes.get("/webhook", verifyWebhook);
whatsappRoutes.post("/webhook", receiveMessage);
whatsappRoutes.post("/test/:userId", testWhatsApp);

export default whatsappRoutes;
