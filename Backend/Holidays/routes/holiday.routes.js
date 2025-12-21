import express from "express";
import * as ctrl from "../controllers/holiday.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { roleCheck } from "../../middleware/role.middleware.js";

const router = express.Router();
router.use(protect);

router.get("/", ctrl.getHolidays);
router.post("/", roleCheck("admin"), ctrl.createHoliday);
router.put("/:id", roleCheck("admin"), ctrl.updateHoliday);
router.delete("/:id", roleCheck("admin"), ctrl.deleteHoliday);

export default router;
