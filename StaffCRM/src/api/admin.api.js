import api from "./axios";

// DASHBOARD
export const getDashboardOverviewAPI = () => api.get("/users/dashboard");

// USERS
export const getAllUsersAPI = () => api.get("/users");

//ALL USERS
export const getAllUsersForAdminAPI = () => api.get("/users/admin/all");

// CREATE USER
export const createUserAPI = (data) => api.post("/users", data);

// UPDATE USER
export const updateUserAPI = (id, data) => api.put(`/users/${id}`, data);

// INACTIVE (Soft delete)
export const inactiveUserAPI = (id) => api.patch(`/users/${id}/inactive`);

// DELETE (Hard delete)
export const deleteUserAPI = (id) => api.delete(`/users/${id}`);

// BIRTHDAYS
export const getEmployeeBirthdaysAPI = () => api.get("/users/birthdays");

// REPORTS
export const downloadAllReportsPDF = (date) =>
  api.get("/reports/download/all", {
    params: { date },
    responseType: "blob",
  });

// Quotes
export const getAllQuotesAPI = () => api.get("/quotation");

export const deleteQuoteAPI = (id) => api.delete(`/quotation/${id}`);
