import express from "express";
import * as ctrl from "./contentCalendar.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleOrPermissionCheck } from "../middleware/role.middleware.js";

const ContentCalendarRoutes = express.Router();

// All staff endpoints require authentication
ContentCalendarRoutes.use(protect);

// Employee Content Reminders (4 days before posting until marked Done)
ContentCalendarRoutes.get("/my-reminders", ctrl.getMyCalendarReminders);

// Quick status update (e.g. marking workStatus as "Done")
ContentCalendarRoutes.patch("/client/:clientId/entries/:rowId/status", ctrl.updateCalendarEntryStatus);

// Status & Read routes: open to authorized staff (admin, hr, employee, intern)
ContentCalendarRoutes.get("/client/:clientId/status", ctrl.getCalendarStatus);
ContentCalendarRoutes.get("/client/:clientId/tabs", ctrl.getCalendarTabs);
ContentCalendarRoutes.post("/client/:clientId/tabs", ctrl.createMonthTab);
ContentCalendarRoutes.get("/client/:clientId/entries", ctrl.getCalendarEntries);
ContentCalendarRoutes.post("/client/:clientId/refresh", ctrl.refreshCalendar);

// Content Management routes (create, update, delete entries)
ContentCalendarRoutes.post("/client/:clientId/entries", ctrl.createCalendarEntry);
ContentCalendarRoutes.patch("/client/:clientId/entries/:rowId", ctrl.updateCalendarEntry);
ContentCalendarRoutes.delete("/client/:clientId/entries/:rowId", ctrl.deleteCalendarEntry);

// Privileged connection management (connect/disconnect)
ContentCalendarRoutes.post(
  "/client/:clientId/connect",
  roleOrPermissionCheck(["admin", "hr"], "clients_manage"),
  ctrl.connectSpreadsheet
);

ContentCalendarRoutes.post(
  "/client/:clientId/disconnect",
  roleOrPermissionCheck(["admin", "hr"], "clients_manage"),
  ctrl.disconnectSpreadsheet
);

export default ContentCalendarRoutes;
