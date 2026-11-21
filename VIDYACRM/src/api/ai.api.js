// src/api/ai.api.js
import api from "./axios";

const handleError = (error) => {
  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data ||
    "AI service is temporarily unavailable. Please try again.";
  throw new Error(backendMessage);
};

export const sendAIMessageAPI = async (message, conversationHistory = []) => {
  try {
    const res = await api.post("/ai/chat", { message, conversationHistory });
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

export const confirmAIActionAPI = async (action, payload = {}) => {
  try {
    const res = await api.post("/ai/confirm", { action, payload });
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

