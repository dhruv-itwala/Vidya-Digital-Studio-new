import {
  processMessage,
  getConversationsService,
  getConversationMessagesService,
  sendManualMessageService,
} from "./whatsapp.service.js";
import { asyncHandler } from "../StaffCRM/utils/asyncHandler.js";

export const verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
};

export const receiveMessage = async (req, res) => {
  try {
    await processMessage(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =====================================================
   STAFF CRM / ADMIN CHAT HISTORY ENDPOINTS
===================================================== */

export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await getConversationsService();
  res.status(200).json({
    success: true,
    data: conversations,
  });
});

export const getConversationMessages = asyncHandler(async (req, res) => {
  const { phone } = req.params;
  const result = await getConversationMessagesService(phone);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const sendManualMessage = asyncHandler(async (req, res) => {
  const { phone } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "Message content cannot be empty",
    });
  }

  const result = await sendManualMessageService(phone, message.trim(), req.user);
  res.status(200).json({
    success: true,
    message: "Message sent successfully",
    data: result,
  });
});