import api from "./axios";

export const getugcCreatorsAPI = (params) =>
  api.get("/ugccreators", { params });
export const createUGCCreatorAPI = (data) => api.post("/ugccreators", data);
export const updateUGCCreatorAPI = (id, data) =>
  api.put(`/ugccreators/${id}`, data);
export const deleteUGCCreatorAPI = (id) => api.delete(`/ugccreators/${id}`);
