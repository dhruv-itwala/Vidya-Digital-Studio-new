// VIDYACRM/src/api/finance.api.js
import api from "./axios";

/* ================= DASHBOARD & OVERVIEW ================= */
export const getFinanceOverviewAPI = () => {
  return api.get("/finance/overview");
};

/* ================= EXPENSES ================= */
export const getExpensesAPI = (params = {}) => {
  return api.get("/finance/expenses", { params });
};

export const getExpenseByIdAPI = (id) => {
  return api.get(`/finance/expenses/${id}`);
};

export const createExpenseAPI = (data) => {
  return api.post("/finance/expenses", data);
};

export const updateExpenseAPI = (id, data) => {
  return api.put(`/finance/expenses/${id}`, data);
};

export const deleteExpenseAPI = (id) => {
  return api.delete(`/finance/expenses/${id}`);
};

export const recordExpensePayoutAPI = (id, data) => {
  return api.post(`/finance/expenses/${id}/payout`, data);
};

/* ================= CASH & BANK ACCOUNTS ================= */
export const getCashAccountsAPI = () => {
  return api.get("/finance/accounts");
};

export const getCashAccountByIdAPI = (id) => {
  return api.get(`/finance/accounts/${id}`);
};

export const createCashAccountAPI = (data) => {
  return api.post("/finance/accounts", data);
};

export const updateCashAccountAPI = (id, data) => {
  return api.put(`/finance/accounts/${id}`, data);
};

export const adjustAccountBalanceAPI = (id, data) => {
  return api.post(`/finance/accounts/${id}/adjust`, data);
};

export const transferBetweenAccountsAPI = (data) => {
  return api.post("/finance/accounts/transfer", data);
};

export const getCashTransactionsAPI = (params = {}) => {
  return api.get("/finance/transactions", { params });
};

