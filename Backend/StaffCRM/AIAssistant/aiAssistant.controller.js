// Backend/StaffCRM/AIAssistant/aiAssistant.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { processAIChat, executeCRMAction } from "./aiAssistant.service.js";
import { logActivity } from "../AuditLog/AuditLog.service.js";

/**
 * Handle incoming conversational/voice message
 */
export const chatAssistant = asyncHandler(async (req, res) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "Message text is required",
    });
  }

  const aiResult = await processAIChat(req.user, message.trim(), conversationHistory);

  // If action is read-only and doesn't need confirmation (e.g. GET_STATUS, GET_TASKS, GET_ATTENDANCE_REPORT, GET_ALL_REPORTS)
  if (!aiResult.requiresConfirmation && aiResult.action && aiResult.action !== "GENERAL_CHAT") {
    const executed = await executeCRMAction(req.user, aiResult.action, aiResult.payload);
    return res.status(200).json({
      success: true,
      reply: executed.reply || aiResult.reply,
      voiceText: executed.voiceText || executed.reply || aiResult.reply,
      action: aiResult.action,
      requiresConfirmation: false,
      data: executed.data || null,
    });
  }

  // Returns conversational reply + optional confirmation prompt
  res.status(200).json({
    success: true,
    reply: aiResult.reply,
    voiceText: aiResult.voiceText || aiResult.reply,
    action: aiResult.action,
    requiresConfirmation: aiResult.requiresConfirmation,
    confirmationPrompt: aiResult.confirmationPrompt,
    payload: aiResult.payload || {},
  });
});

/**
 * Handle confirmed user action (e.g. user clicked "Confirm" or spoke "Yes confirm")
 */
export const executeConfirmedAction = asyncHandler(async (req, res) => {
  const { action, payload = {} } = req.body;

  if (!action) {
    return res.status(400).json({
      success: false,
      message: "Action name is required",
    });
  }

  const result = await executeCRMAction(req.user, action, payload);

  if (result.success) {
    logActivity({
      req,
      user: req.user,
      category: "AIAssistant",
      module: "AI",
      action: action,
      description: `${req.user.name} executed ${action} via AI Assistant`,
    });
  }

  res.status(200).json(result);
});

