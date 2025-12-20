import api from "./axios";

// Employee
export const punchInAPI = () => api.post("/attendance/punch-in");

export const breakStartAPI = () => api.post("/attendance/break-start");

export const breakEndAPI = () => api.post("/attendance/break-end");

export const punchOutAPI = () => api.post("/attendance/punch-out");

export const getMyAttendanceAPI = () => api.get("/attendance/my");

// Admin
export const getAllAttendanceAPI = (date) =>
  api.get("/attendance/all", { params: { date } });

export const downloadAttendancePDF = (from, to) =>
  api.get("/attendance/download", {
    params: { from, to },
    responseType: "blob", // important for PDF
  });
