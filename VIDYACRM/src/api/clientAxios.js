import axios from "axios";

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

    if (status === 401) {
      localStorage.removeItem("clientToken");
      localStorage.removeItem("clientData");
      window.location.href = "/client-login";
    }

    return Promise.reject({
      status,
      message: data?.message || data?.error || error.message || "Something went wrong",
      data,
    });
  }
);

export default clientApi;
