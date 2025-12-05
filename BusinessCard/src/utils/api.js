const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3007";
const VERSION = import.meta.env.VITE_VERSION || "v0.1";

export const API_URL = `${BACKEND_URL}/${VERSION}/api`;
