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

// Update report
export const updateReportAPI = async (id, workPoints) => {
  try {
    return await api.put(`/reports/update/${id}`, { workPoints });
  } catch (error) {
    handleError(error);
  }
};

// Get my all reports
export const getMyAllReportsAPI = async () => {
  try {
    return await api.get("/reports/my");
  } catch (error) {
    handleError(error);
  }
};

// Get my reports by date
const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

export const getMyReportsByDateAPI = async (date = getTodayDate()) => {
  try {
    return await api.get(`/reports/my/date?date=${date}`);
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

// Download customized reports PDF
export const downloadCustomReportsPDF = async (
  employeeIds,
  fromDate,
  toDate
) => {
  try {
    return await api.post(
      `/reports/download/custom`,
      {
        employeeIds,
        fromDate,
        toDate,
      },
      {
        responseType: "blob",
      }
    );
  } catch (error) {
    handleError(error);
  }
};
