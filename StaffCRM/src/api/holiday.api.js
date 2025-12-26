import api from "./axios";

// ================= HOLIDAYS =================

// Get all holidays (admin & hr)
export const getHolidaysAPI = () => api.get("/holiday");

// Get upcoming holidays (employee)
export const getUpcomingHolidaysAPI = () => api.get("/holiday/employee");

// Admin – create holiday
export const createHolidayAPI = (data) => api.post("/holiday", data);

// Admin – update holiday
export const updateHolidayAPI = (id, data) => api.put(`/holiday/${id}`, data);

// Admin – delete holiday
export const deleteHolidayAPI = (id) => api.delete(`/holiday/${id}`);
