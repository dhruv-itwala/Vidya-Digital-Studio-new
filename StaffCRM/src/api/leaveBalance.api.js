// src/api/leaveBalance.api.js
import api from "./axios";

export const getMyLeaveBalanceAPI = () => api.get("/leave-balance/me");

export const getAllLeaveBalancesAPI = () => api.get("/leave-balance/alldata");
