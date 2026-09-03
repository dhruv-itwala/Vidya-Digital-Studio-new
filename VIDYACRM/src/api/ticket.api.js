import api from "./axios";

export const createTicketAPI = (data) => api.post("/tickets", data);
export const getMyTicketsAPI = () => api.get("/tickets/my");
export const getAllTicketsAPI = () => api.get("/tickets");
export const updateTicketStatusAPI = (id, data) => api.put(`/tickets/${id}/status`, data);
