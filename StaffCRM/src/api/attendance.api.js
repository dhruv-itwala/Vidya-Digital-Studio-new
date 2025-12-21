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

export const markAttendanceStatusAPI = async (data) => {
  try {
    return await api.post("/attendance/mark", data);
  } catch (error) {
    handleError(error);
  }
};
