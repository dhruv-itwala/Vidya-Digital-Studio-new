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

// Quotes
export const getAllQuotesAPI = () => api.get("/quotation");

export const deleteQuoteAPI = (id) => api.delete(`/quotation/${id}`);

// Salary Deduction Reports
export const getMySalaryDeductionAPI = (from, to) =>
  api.get("/users/salary/my", {
    params: { from, to },
  });

export const getEmployeeSalaryDeductionAPI = (userId, from, to) =>
  api.get("/users/salary/employee", {
    params: { userId, from, to },
  });
