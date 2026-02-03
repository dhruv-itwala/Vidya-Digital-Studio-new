import api from "./axios";

export const createClient = async (data) => {
  const res = await api.post("/clients", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const updateClient = async (clientId, data) => {
  const res = await api.put(`/clients/${clientId}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const getAllClients = async () => {
  const res = await api.get("/clients");
  return res.data;
};

export const getClientById = async (clientId) => {
  const res = await api.get(`/clients/${clientId}`);
  return res.data;
};

export const deleteClient = async (clientId) => {
  const res = await api.delete(`/clients/${clientId}`);
  return res.data;
};

export const addClientTransaction = async (clientId, payload) => {
  const res = await api.post(`/clients/${clientId}/transactions`, payload);
  return res.data;
};
