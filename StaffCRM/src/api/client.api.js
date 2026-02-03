import api from "./axios";

export const createClient = async (data) => {
  const res = await api.post("/clients", data);
  return res.data;
};

export const updateClient = async (clientId, data) => {
  const res = await api.patch(`/clients/${clientId}`, data);
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

export const toggleClientStatus = async (clientId) => {
  const res = await api.patch(`/clients/${clientId}/toggle-status`);
  return res.data;
};

// Transaction operations
export const addClientTransaction = async (clientId, payload) => {
  const res = await api.post(`/clients/${clientId}/transactions`, payload);
  return res.data;
};

export const updateClientTransaction = async (
  clientId,
  transactionId,
  payload,
) => {
  const res = await api.patch(
    `/clients/${clientId}/transactions/${transactionId}`,
    payload,
  );
  return res.data;
};

export const deleteClientTransaction = async (clientId, transactionId) => {
  const res = await api.delete(
    `/clients/${clientId}/transactions/${transactionId}`,
  );
  return res.data;
};

// Document operations
export const addClientDocument = async (clientId, formData) => {
  const res = await api.post(`/clients/${clientId}/documents`, formData);
  return res.data;
};

export const deleteClientDocument = async (clientId, documentId) => {
  const res = await api.delete(`/clients/${clientId}/documents/${documentId}`);
  return res.data;
};

// Credential operations
export const addClientCredential = async (clientId, payload) => {
  const res = await api.post(`/clients/${clientId}/credentials`, payload);
  return res.data;
};

export const updateClientCredential = async (
  clientId,
  credentialId,
  payload,
) => {
  const res = await api.patch(
    `/clients/${clientId}/credentials/${credentialId}`,
    payload,
  );
  return res.data;
};

export const deleteClientCredential = async (clientId, credentialId) => {
  const res = await api.delete(
    `/clients/${clientId}/credentials/${credentialId}`,
  );
  return res.data;
};
