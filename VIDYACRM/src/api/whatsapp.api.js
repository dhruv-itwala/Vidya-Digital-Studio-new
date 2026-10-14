import api from "./axios";

// ================= WHATSAPP CHATS & CONVERSATIONS =================

// Get all WhatsApp conversation threads
export const getWhatsappConversationsAPI = () =>
  api.get("/whatsapp/conversations");

// Get messages for a specific phone number
export const getWhatsappMessagesAPI = (phone) =>
  api.get(`/whatsapp/conversations/${encodeURIComponent(phone)}/messages`);

// Send a manual reply/message to a phone number from CRM
export const sendWhatsappMessageAPI = (phone, message) =>
  api.post(`/whatsapp/conversations/${encodeURIComponent(phone)}/send`, {
    message,
  });
