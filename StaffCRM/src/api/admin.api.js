import api from "./axios";

// USERS
export const getAllUsersAPI = () => api.get("/users");

export const createUserAPI = (data) => api.post("/users", data);

export const updateUserAPI = (id, data) => api.put(`/users/${id}`, data);

// BIRTHDAYS
export const getEmployeeBirthdaysAPI = () => api.get("/users/birthdays");

// DELETE (Soft delete)
export const deleteUserAPI = (id) => api.delete(`/users/${id}`);

// REPORTS
export const downloadAllReportsPDF = (date) =>
  api.get("/reports/download/all", {
    params: { date },
    responseType: "blob",
  });
