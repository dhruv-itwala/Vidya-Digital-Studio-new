import express from "express";
import {
  getAuditLogs,
  deleteOldLogs,
  getEntityHistory,
} from "./AuditLog.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";

const auditLogRoutes = express.Router();
auditLogRoutes.use(protect);
auditLogRoutes.get("/",roleCheck("admin", "hr"), getAuditLogs);
auditLogRoutes.get("/entity/:module/:entityId", getEntityHistory);
auditLogRoutes.delete("/purge", deleteOldLogs);

export default auditLogRoutes;
