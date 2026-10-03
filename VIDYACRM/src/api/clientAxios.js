import axios from "axios";
import { getBackendErrorMessage } from "../utils/errorHandler";

const clientApi = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/${import.meta.env.VITE_VERSION}`,
  timeout: 300000,
});

// REQUEST INTERCEPTOR
clientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("clientToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// RESPONSE INTERCEPTOR
clientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Normalize error message from any backend structure
    const message = getBackendErrorMessage(error, "Something went wrong");

    if (status === 401) {
      localStorage.removeItem("clientToken");
      localStorage.removeItem("clientData");

      const isClientLoginRoute =
        typeof window !== "undefined" &&
        (window.location.pathname === "/client-login" ||
          window.location.pathname.startsWith("/client-login"));

      if (!isClientLoginRoute) {
        window.location.href = "/client-login";
      }
    }

    const errorObj = new Error(message);
    errorObj.status = status;
    errorObj.message = message;
    errorObj.data = data;
    errorObj.response = error.response;

    return Promise.reject(errorObj);
  }
);

export default clientApi;
