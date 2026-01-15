import api from "./axios";

export const getAllClientsAPI = () => api.get("/clients");
export const getClientAPI = (id) => api.get(`/clients/${id}`);
export const createClientAPI = (data) => api.post("/clients", data);
export const updateClientAPI = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClientAPI = (id) => api.delete(`/clients/${id}`);
