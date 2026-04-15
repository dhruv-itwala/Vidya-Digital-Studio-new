import api from "./axios";

export const getInfluencersAPI = (params) =>
  api.get("/influencers", { params });
export const createInfluencerAPI = (data) => api.post("/influencers", data);
export const updateInfluencerAPI = (id, data) =>
  api.put(`/influencers/${id}`, data);
export const deleteInfluencerAPI = (id) => api.delete(`/influencers/${id}`);
