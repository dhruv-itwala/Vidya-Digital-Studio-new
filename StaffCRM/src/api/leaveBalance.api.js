import api from "./axios";

// ---------- EMPLOYEE ----------
export const getMyLeaveBalanceAPI = (year) =>
  api.get(`/leave-balance/my?year=${year}`);

// ---------- ADMIN / HR ----------
export const getAllUsersLeaveBalanceAPI = (year) =>
  api.get(`/leave-balance/all?year=${year}`);

export const setOpeningBalanceAPI = (data) =>
  api.post(`/leave-balance/set-opening`, data);
