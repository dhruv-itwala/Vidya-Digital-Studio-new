// api.endpoints.js
import apiClient from "./api.client";

export const fetchAllServicePrices = () => {
  return apiClient.get("/service-prices");
};

export const fetchServicePricesByCategory = (category) => {
  return apiClient.get(`/service-prices/${category}`);
};

export const generateQuote = (quoteData) => {
  return apiClient.post("/quotation/pdf/generate", quoteData);
};
