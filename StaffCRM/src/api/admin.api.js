import api from "./axios";

// USERS
export const getAllUsersAPI = () => api.get("/users");
export const createUserAPI = (data) => api.post("/users", data);
export const updateUserAPI = (id, data) => api.put(`/users/${id}`, data);

// REPORTS
export const downloadAllReportsPDF = (date) =>
  api.get("/reports/download/all", {
    params: { date },
    responseType: "blob",
  });
