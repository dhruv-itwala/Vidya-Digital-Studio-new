import express from "express";
import * as ctrl from "./leave.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";

const router = express.Router();
router.use(protect);

// Employee
router.post("/apply", ctrl.applyLeave);
router.get("/my", ctrl.myLeaves);
router.post("/:id/cancel", ctrl.cancelLeave);
router.get("/summary", ctrl.leaveSummary);

// Both Admin and HR can access these routes
router.get("/all", roleCheck("admin", "HR"), ctrl.allLeaves);
router.post("/:id/approve", roleCheck("admin", "HR"), ctrl.approveLeave);
router.post("/:id/decline", roleCheck("admin", "HR"), ctrl.declineLeave);

export default router;
