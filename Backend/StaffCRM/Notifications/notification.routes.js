import express from "express";
import { subscribe, testNotification } from "./notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const notificationRoutes = express.Router();

notificationRoutes.post("/subscribe", protect, subscribe);
notificationRoutes.post("/test", protect, testNotification);

export default notificationRoutes;
