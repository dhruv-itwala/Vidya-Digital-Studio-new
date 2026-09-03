import express from "express";
import * as ctrl from "./payroll.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(protect);

// Employee routes
router.get("/my", ctrl.getMyPayslips);

// HR / Admin routes
router.use(roleCheck("admin", "hr"));
router.post("/generate", ctrl.generateDraftPayrolls);
router.get("/", ctrl.getPayrollsByMonth);
router.put("/:id/pay", ctrl.markPayrollAsPaid);
router.post("/:id/send", ctrl.sendPayslip);

export default router;
