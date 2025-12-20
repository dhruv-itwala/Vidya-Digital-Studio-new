import api from "./axios";

// LOGIN
export const loginAPI = (data) => api.post("/users/login", data);

// GET OWN PROFILE
export const getMyProfileAPI = () => api.get("/users/me");

// UPDATE OWN PROFILE
export const updateMyProfileAPI = (data) => api.put("/users/me", data);

export const getAllUsersAPI = () => api.get("/users");

// LOGOUT (frontend only)
export const logoutAPI = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
