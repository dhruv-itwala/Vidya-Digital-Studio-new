import api from "./axios";

// Submit daily report
export const submitReportAPI = (workPoints) =>
  api.post("/reports/submit", { workPoints });

// Employee
export const getMyReportsAPI = () => api.get("/reports/my");

// Admin
export const getAllReportsByDate = (date) =>
  api.get(`/reports/all?date=${date}`);

// Download PDF
export const downloadAllReportsByDatePDF = (date) =>
  api.get(`/reports/download/all?date=${date}`, {
    responseType: "blob",
  });
