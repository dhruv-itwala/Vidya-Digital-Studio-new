import api from "./axios";

// ================= HOLIDAYS =================

// Get all holidays (admin & employee)
export const getHolidaysAPI = () => api.get("/holiday");

// Admin – create holiday
export const createHolidayAPI = (data) => api.post("/holiday", data);

// Admin – update holiday
export const updateHolidayAPI = (id, data) => api.put(`/holiday/${id}`, data);

// Admin – delete holiday
export const deleteHolidayAPI = (id) => api.delete(`/holiday/${id}`);
