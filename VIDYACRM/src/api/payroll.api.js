import api from "./axios";

export const generatePayrollsAPI = (data) => api.post("/payroll/generate", data);
export const getPayrollsByMonthAPI = (month, year) => api.get(`/payroll?month=${month}&year=${year}`);
export const getMyPayslipsAPI = () => api.get("/payroll/my");
export const markPayrollPaidAPI = (id) => api.put(`/payroll/${id}/pay`);
export const sendPayslipAPI = (id) => api.post(`/payroll/${id}/send`);
