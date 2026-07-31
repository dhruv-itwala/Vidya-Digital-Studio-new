import api from "./axios";

// GET AUDIT LOGS
export const getAuditLogsAPI = (params) => api.get("/audit-logs", { params });

// DELETE OLD AUDIT LOGS
export const deleteOldAuditLogsAPI = () => api.delete("/audit-logs/purge");

// GET ENTITY HISTORY
export const getEntityHistoryAPI = (module, entityId) => 
  api.get(`/audit-logs/entity/${module}/${entityId}`);
