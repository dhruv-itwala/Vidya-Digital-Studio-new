import express from "express";
import { getNotificationsController } from "./notification.controller.js";

const notificationRoutes = express.Router();

notificationRoutes.get("/", getNotificationsController);

export default notificationRoutes;
