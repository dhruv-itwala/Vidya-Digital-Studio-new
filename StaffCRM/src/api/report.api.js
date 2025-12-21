import api from "./axios";

const handleError = (error) => {
  const message =
    error?.response?.data?.message || "Something went wrong. Please try again.";

  throw new Error(message);
};

// ================= EMPLOYEE =================

// Submit daily report
export const submitReportAPI = async (workPoints) => {
  try {
    return await api.post("/reports/submit", { workPoints });
  } catch (error) {
    handleError(error);
  }
};

// Get my reports
export const getMyReportsAPI = async () => {
  try {
    return await api.get("/reports/my");
  } catch (error) {
    handleError(error);
  }
};

// ================= ADMIN =================

export const getAllReportsByDate = async (date) => {
  try {
    return await api.get(`/reports/all?date=${date}`);
  } catch (error) {
    handleError(error);
  }
};

// Download PDF
export const downloadAllReportsByDatePDF = async (date) => {
  try {
    return await api.get(`/reports/download/all?date=${date}`, {
      responseType: "blob",
    });
  } catch (error) {
    handleError(error);
  }
};
