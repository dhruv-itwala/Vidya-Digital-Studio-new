import api from "./axios";

// ================= CLIENTS =================

// Get all clients
export const getClientsAPI = (params) => api.get("/clients", { params });

// Get single client
export const getClientByIdAPI = (id) => api.get(`/clients/${id}`);

/* ================= FORM DATA BUILDER ================= */

const buildFormData = (data) => {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    const value = data[key];

    if (key === "profilePhoto" && value) {
      formData.append("profilePhoto", value);
    } else if (Array.isArray(value)) {
      // Convert arrays to JSON string
      formData.append(key, JSON.stringify(value));
    } else if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  return formData;
};

/* ================= CREATE ================= */

export const createClientAPI = (data) =>
  api.post("/clients", buildFormData(data));

/* ================= UPDATE ================= */

export const updateClientAPI = (id, data) =>
  api.patch(`/clients/${id}`, buildFormData(data));

/* ================= DEACTIVATE ================= */

export const deactivateClientAPI = (id) =>
  api.patch(`/clients/${id}/deactivate`);

/* ================= CREDENTIALS ================= */

export const addCredentialAPI = (id, data) =>
  api.post(`/clients/${id}/credentials`, data);

export const updateCredentialAPI = (clientId, credId, data) =>
  api.patch(`/clients/${clientId}/credentials/${credId}`, data);

export const deleteCredentialAPI = (clientId, credId) =>
  api.delete(`/clients/${clientId}/credentials/${credId}`);

/* ================= TRANSACTIONS ================= */
export const addTransactionAPI = (id, data) =>
  api.post(`/clients/${id}/transactions`, data);

export const updateTransactionAPI = (clientId, txnId, data) =>
  api.patch(`/clients/${clientId}/transactions/${txnId}`, data);

export const deleteTransactionAPI = (clientId, txnId) =>
  api.delete(`/clients/${clientId}/transactions/${txnId}`);

/* ================= DOCUMENTS ================= */
export const uploadDocumentAPI = (id, file) => {
  const formData = new FormData();
  formData.append("document", file);
  return api.post(`/clients/${id}/documents`, formData);
};

export const deleteDocumentAPI = (id, publicId) =>
  api.delete(`/clients/${id}/documents/${publicId}`);
