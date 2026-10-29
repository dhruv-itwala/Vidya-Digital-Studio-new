// PunchAPK/src/api/client.ts
import axios, { AxiosInstance, AxiosError } from "axios";
import { getKioskConfig } from "../services/storage.service";

let cachedClient: AxiosInstance | null = null;
let currentApiUrl: string = "";

export const getApiClient = async (): Promise<AxiosInstance> => {
  const config = await getKioskConfig();

  if (!cachedClient || currentApiUrl !== config.apiUrl) {
    currentApiUrl = config.apiUrl;
    cachedClient = axios.create({
      baseURL: config.apiUrl,
      timeout: 15000, // 15 second network timeout
      headers: {
        "Content-Type": "application/json",
      },
    });

    cachedClient.interceptors.request.use(async (reqConfig) => {
      const activeConfig = await getKioskConfig();
      reqConfig.headers["X-Kiosk-Device-Id"] = activeConfig.deviceId;
      reqConfig.headers["X-Kiosk-Device-Key"] = activeConfig.deviceKey;
      return reqConfig;
    });

    cachedClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ message?: string; error?: string }>) => {
        let errorMessage = "Unable to connect to the attendance server.";

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please check your network connection.";
        } else if (error.response?.status === 401) {
          errorMessage = "Kiosk terminal is not authorized. Please check device credentials.";
        } else if (error.response?.status === 403) {
          errorMessage = error.response.data?.message || "Operation forbidden by attendance policy.";
        } else if (error.response?.status === 404) {
          errorMessage = "Employee or resource not found.";
        } else if (error.response?.status && error.response.status >= 500) {
          errorMessage = "Server error occurred. Please contact the administrator.";
        }

        const customError = new Error(errorMessage);
        (customError as any).status = error.response?.status;
        (customError as any).originalError = error;
        return Promise.reject(customError);
      },
    );
  }

  return cachedClient;
};

export const pingBackend = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    const client = await getApiClient();
    const res = await client.get("/kiosk/employees", { params: { search: "__ping__" } });
    return { ok: res.status === 200, message: "Connected successfully" };
  } catch (err: any) {
    return { ok: false, message: err.message || "Failed to reach server" };
  }
};

