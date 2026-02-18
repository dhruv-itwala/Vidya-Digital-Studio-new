import api from "./axios";

/* =========================================
   CREATE CLIENT
   Accepts FormData
========================================= */
export const createClient = async (formData) => {
  const res = await api.post("/clients", formData);
  return res.data;
};

/* =========================================
   UPDATE CLIENT
   Accepts FormData
========================================= */
export const updateClient = async (clientId, formData) => {
  const res = await api.put(`/clients/${clientId}`, formData);

  return res.data;
};

/* =========================================
   UPLOAD DOCUMENTS (MULTIPLE)
========================================= */
export const uploadClientDocuments = async (clientId, formData) => {
  const res = await api.post(`/clients/${clientId}/documents`, formData);

  return res.data;
};

/* =========================================
   DELETE SINGLE DOCUMENT
========================================= */
export const deleteClientDocument = async (clientId, documentId) => {
  const res = await api.delete(`/clients/${clientId}/documents/${documentId}`);

  return res.data;
};

/* =========================================
   GET ALL CLIENTS
========================================= */
export const getAllClients = async () => {
  const res = await api.get("/clients");
  return res.data;
};

/* =========================================
   GET SINGLE CLIENT
========================================= */
export const getClientById = async (clientId) => {
  const res = await api.get(`/clients/${clientId}`);
  return res.data;
};

/* =========================================
   DELETE CLIENT (SOFT DELETE)
========================================= */
export const deleteClient = async (clientId) => {
  const res = await api.delete(`/clients/${clientId}`);
  return res.data;
};
