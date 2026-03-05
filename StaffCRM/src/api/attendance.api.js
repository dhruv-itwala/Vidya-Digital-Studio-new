// src/api/attendance.api.js
import api from "./axios";

const handleError = (error) => {
  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data ||
    "Something went wrong. Please try again.";

  // 🔥 Throw a REAL Error object
  throw new Error(backendMessage);
};

// ================= EMPLOYEE =================
export const getTodayWorkRecordAPI = async () => {
  try {
    return await api.get("/attendance/work-record/today");
  } catch (error) {
    handleError(error);
  }
};

export const punchInAPI = async () => {
  try {
    return await api.post("/attendance/punch-in");
  } catch (error) {
    handleError(error);
  }
};

export const punchOutAPI = async () => {
  try {
    return await api.post("/attendance/punch-out");
  } catch (error) {
    handleError(error);
  }
};

export const breakInAPI = async () => {
  try {
    return await api.post("/attendance/break-in");
  } catch (error) {
    handleError(error);
  }
};

export const breakOutAPI = async () => {
  try {
    return await api.post("/attendance/break-out");
  } catch (error) {
    handleError(error);
  }
};

export const getMyAttendanceAPI = async (params) => {
  try {
    return await api.get("/attendance/my", { params });
  } catch (error) {
    handleError(error);
  }
};

const getTodayDate = () => {
  const now = new Date();
  const istOffset = 5.5 * 60; // IST is UTC+5:30 in minutes
  const istTime = new Date(now.getTime() + istOffset * 60 * 1000);
  return istTime.toISOString().split("T")[0];
};

export const getMyAttendanceByDateAPI = async (date = getTodayDate()) => {
  try {
    return await api.get(`/attendance/my/date?date=${date}`);
  } catch (error) {
    handleError(error);
  }
};

// ================= ADMIN / HR =================
export const getDayAttendanceAPI = async (date) => {
  try {
    return await api.get("/attendance/day", { params: { date } });
  } catch (error) {
    handleError(error);
  }
};

export const getAllEmployeesAttendanceAPI = async (date) => {
  try {
    return await api.get("/attendance/all", { params: { date } });
  } catch (error) {
    handleError(error);
  }
};

export const getAllEmployeesAttendanceByDateRangeAPI = async (from, to) => {
  try {
    return await api.get("/attendance/all/date", {
      params: { from, to },
    });
  } catch (error) {
    handleError(error);
  }
};

export const downloadAttendancePDFWithPunchAPI = async (from, to) => {
  try {
    return await api.get("/attendance/download/timepdf", {
      params: { from, to },
      responseType: "blob",
    });
  } catch (error) {
    handleError(error);
  }
};

export const markAttendanceStatusAPI = async (data) => {
  try {
    return await api.put("/attendance/mark", data);
  } catch (error) {
    handleError(error);
  }
};

export const getLiveEmployeesStatusAPI = async (date) => {
  try {
    return await api.get("/attendance/live-status/date", { params: { date } });
  } catch (error) {
    handleError(error);
  }
};

export const downloadAttendancePDFAPI = async (from, to) => {
  return api.get("/attendance/download/pdf", {
    params: { from, to },
    responseType: "blob",
  });
};

export const getWeeklyProgressAPI = async () => {
  try {
    return await api.get("/attendance/weekly-progress");
  } catch (error) {
    handleError(error);
  }
};

export const getAllUsersWeeklyProgressAPI = async (weekStart) => {
  try {
    return await api.get("/attendance/weekly-progress/all", {
      params: { weekStart },
    });
  } catch (error) {
    handleError(error);
  }
};
