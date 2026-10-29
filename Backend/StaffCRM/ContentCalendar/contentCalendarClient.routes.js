import express from "express";
import * as ctrl from "./contentCalendarClient.controller.js";
import { clientProtect } from "../middleware/auth.middleware.js";

const ContentCalendarClientRoutes = express.Router();

// Strict client authentication: clients only
ContentCalendarClientRoutes.use(clientProtect);

// Read-only endpoints
ContentCalendarClientRoutes.get("/status", ctrl.getClientCalendarStatus);
ContentCalendarClientRoutes.get("/tabs", ctrl.getClientCalendarTabs);
ContentCalendarClientRoutes.get("/entries", ctrl.getClientCalendarEntries);
ContentCalendarClientRoutes.post("/refresh", ctrl.refreshClientCalendar);

export default ContentCalendarClientRoutes;
