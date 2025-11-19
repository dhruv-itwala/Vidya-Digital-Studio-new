// api.js
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://192.168.137.1:1212";
const VERSION = import.meta.env.VITE_VERSION || "v1.0";

// Final: http://192.168.137.1:1212/api/v1.0
export const API_URL = `${BACKEND_URL}/api/${VERSION}`;
