import express from "express";
import * as ctrl from "./holiday.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";

const holidayRoutes = express.Router();
holidayRoutes.use(protect);

holidayRoutes.get("/", ctrl.getHolidays);
holidayRoutes.get("/employee", ctrl.getUpcomingHolidays);
holidayRoutes.post("/", roleCheck("admin", "hr"), ctrl.createHoliday);
holidayRoutes.put("/:id", roleCheck("admin", "hr"), ctrl.updateHoliday);
holidayRoutes.delete("/:id", roleCheck("admin", "hr"), ctrl.deleteHoliday);

export default holidayRoutes;
