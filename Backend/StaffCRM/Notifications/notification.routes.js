import express from "express";
import {
  subscribe,
  testNotification,
  triggerReminders,
} from "./notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const notificationRoutes = express.Router();

notificationRoutes.post("/subscribe", protect, subscribe);
notificationRoutes.post("/test", protect, testNotification);
notificationRoutes.post("/trigger-reminders", protect, triggerReminders);

export default notificationRoutes;

