import api from "./axios";

// ================= EMPLOYEE =================
export const applyLeaveAPI = (data) => api.post("/leave/apply", data);

export const getMyLeavesAPI = () => api.get("/leave/my");

export const cancelLeaveAPI = (id) => api.post(`/leave/${id}/cancel`);

export const getLeaveSummaryAPI = () => api.get("/leave/summary");

// ================= ADMIN =================
export const getAllLeavesAPI = () => api.get("/leave/all");

export const approveLeaveAPI = (id) => api.post(`/leave/${id}/approve`);

export const declineLeaveAPI = (id) => api.post(`/leave/${id}/decline`);
