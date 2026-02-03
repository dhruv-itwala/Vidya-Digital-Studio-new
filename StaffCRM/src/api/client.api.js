import api from "./axios";

// CREATE CLIENT
export const createClient = async (data) => {
  // data can be FormData OR JSON
  const res = await api.post("/clients", data);
  return res.data;
};

// UPDATE CLIENT
export const updateClient = async (clientId, data) => {
  return api
    .post(`/clients/${clientId}`, data, {
      // 🚫 DO NOT set Content-Type manually
      // Axios will set multipart boundary automatically
    })
    .then((res) => res.data);
};

// GET ALL
export const getAllClients = async () => {
  const res = await api.get("/clients");
  return res.data;
};

// GET ONE
export const getClientById = async (clientId) => {
  const res = await api.get(`/clients/${clientId}`);
  return res.data;
};

// DELETE
export const deleteClient = async (clientId) => {
  const res = await api.delete(`/clients/${clientId}`);
  return res.data;
};
