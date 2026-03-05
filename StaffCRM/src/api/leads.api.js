import api from "./axios";

// ================= LEADS =================

// Get all leads (with filters)
export const getLeadsAPI = (params) => api.get("/leads", { params });

// Get single lead
export const getLeadByIdAPI = (id) => api.get(`/leads/${id}`);

// Create lead
export const createLeadAPI = (data) => api.post("/leads", data);

// Update lead
export const updateLeadAPI = (id, data) => api.patch(`/leads/${id}`, data);

// Delete lead
export const deleteLeadAPI = (id) => api.delete(`/leads/${id}`);

// Update lead status
export const updateLeadStatusAPI = (id, status) =>
  api.patch(`/leads/${id}/status`, { status });

// Add meeting note
export const addMeetingNoteAPI = (id, data) =>
  api.post(`/leads/${id}/meeting-note`, data);

// Convert lead to client
export const convertLeadAPI = (id) => api.post(`/leads/${id}/convert`);
