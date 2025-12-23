import api from "./axios";

// LOGIN
export const loginAPI = (data) => api.post("/users/login", data);

// PROFILE (READ ONLY)
export const getMyProfileAPI = () => api.get("/users/me");

// LOGOUT (frontend only)
export const logoutAPI = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
