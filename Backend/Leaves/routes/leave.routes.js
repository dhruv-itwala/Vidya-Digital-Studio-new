import express from "express";
import * as ctrl from "../controllers/leave.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { roleCheck } from "../../middleware/role.middleware.js";

const router = express.Router();
router.use(protect);

// Employee
router.post("/apply", ctrl.applyLeave);
router.get("/my", ctrl.myLeaves);
router.post("/:id/cancel", ctrl.cancelLeave);
router.get("/summary", ctrl.leaveSummary);

// Admin
router.get("/all", roleCheck("admin"), ctrl.allLeaves);
router.post("/:id/approve", roleCheck("admin"), ctrl.approveLeave);
router.post("/:id/decline", roleCheck("admin"), ctrl.declineLeave);

export default router;
