import express from "express";
import { verifyWebhook, receiveMessage } from "./whatsapp.controller.js";

const whatsappRoutes = express.Router();

whatsappRoutes.get("/webhook", verifyWebhook);
whatsappRoutes.post("/webhook", receiveMessage);

export default whatsappRoutes;
