import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/${import.meta.env.VITE_VERSION}`,
  timeout: 300000,
});

// REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Normalize message
    const message =
      data?.message || data?.error || error.message || "Something went wrong";

    // Handle auth errors
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login"; // optional
    }

    // Optional: Handle forbidden
    if (status === 403) {
      console.warn("Forbidden access");
    }

    // Optional: Handle server crash
    if (status >= 500) {
      console.error("Server error");
    }

    const errorObj = new Error(message);
    errorObj.status = status;
    errorObj.message = message;
    errorObj.data = data;
    errorObj.response = error.response;

    return Promise.reject(errorObj);
  },
);

export default api;
