import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const clientApi = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor
clientApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("clientToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
clientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("clientToken");
      localStorage.removeItem("clientData");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default clientApi;
