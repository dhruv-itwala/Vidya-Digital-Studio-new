// Backend/StaffCRM/Kiosk/kiosk.routes.js
import express from "express";
import * as ctrl from "./kiosk.controller.js";
import { kioskAuth } from "../middleware/kioskAuth.middleware.js";

const kioskRoutes = express.Router();

/* All kiosk routes are strictly protected by kiosk device authorization */
kioskRoutes.use(kioskAuth);

/* Employee Directory & Live Status */
kioskRoutes.get("/employees", ctrl.getKioskEmployees);
kioskRoutes.get("/employees/:id/status", ctrl.getKioskEmployeeStatus);

/* Kiosk Punch Actions */
kioskRoutes.post("/punch-in", ctrl.kioskPunchIn);
kioskRoutes.post("/punch-out", ctrl.kioskPunchOut);

export default kioskRoutes;

