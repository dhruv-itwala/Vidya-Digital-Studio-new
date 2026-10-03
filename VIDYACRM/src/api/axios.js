import axios from "axios";
import { getBackendErrorMessage } from "../utils/errorHandler";

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

    // Normalize error message from any backend structure
    const message = getBackendErrorMessage(error, "Something went wrong");

    // Handle auth errors (Prevent infinite reload loop if already on /login)
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const isLoginRoute =
        typeof window !== "undefined" &&
        (window.location.pathname === "/login" ||
          window.location.pathname.startsWith("/login"));

      if (!isLoginRoute) {
        window.location.href = "/login";
      }
    }

    // Optional: Handle forbidden
    if (status === 403) {
      console.warn("Forbidden access:", message);
    }

    // Optional: Handle server crash
    if (status >= 500) {
      console.error("Server error:", message);
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
