import express from "express";
import { verifyWebhook, receiveMessage } from "./whatsapp.controller.js";
import { apiLogger } from "../logger/logger.middleware.js";

const whatsappRoutes = express.Router();
whatsappRoutes.use(apiLogger);

whatsappRoutes.get("/webhook", verifyWebhook);
whatsappRoutes.post("/webhook", receiveMessage);

export default whatsappRoutes;
