// api.endpoints.js
import apiClient from "./api.client";

// POST http://192.168.137.1:1212/api/v1.0/quotation/pdf/generate
export const generateQuote = (quoteData) => {
  return apiClient.post("/quotation/pdf/generate", quoteData);
};
