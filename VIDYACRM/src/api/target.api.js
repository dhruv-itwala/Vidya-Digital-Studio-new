import api from "./axios";

export const getMyTargetsAPI = () => api.get("/targets/my-targets");
export const getUserTargetsAPI = (userId) => api.get(`/targets/${userId}`);
export const setTargetAPI = (data) => api.post("/targets", data);
