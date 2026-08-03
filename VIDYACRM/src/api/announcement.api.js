import api from "./axios";

export const getAnnouncementsAPI = () => api.get("/announcements");
export const createAnnouncementAPI = (data) => api.post("/announcements", data);
export const deleteAnnouncementAPI = (id) => api.delete(`/announcements/${id}`);
