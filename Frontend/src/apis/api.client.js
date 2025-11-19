import axios from "axios";
import { API_URL } from "./api";

const apiClient = axios.create({
  baseURL: API_URL || "http://localhost:3007",
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
