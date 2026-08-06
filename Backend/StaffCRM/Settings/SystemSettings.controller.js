import SystemSettings from "./SystemSettings.model.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper to ensure at least one document exists
export const getGlobalSettings = async () => {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create({});
  }
  return settings;
};

// @route   GET /api/settings
// @desc    Get system settings
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getGlobalSettings();
  res.status(200).json({ success: true, settings });
});

// @route   PUT /api/settings
// @desc    Update system settings
export const updateSettings = asyncHandler(async (req, res) => {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create({});
  }

  // Update specific fields
  if (req.body.notifications) {
    if (req.body.notifications.reminders) {
      settings.notifications.reminders = { ...settings.notifications.reminders, ...req.body.notifications.reminders };
    }
    if (req.body.notifications.info) {
      settings.notifications.info = { ...settings.notifications.info, ...req.body.notifications.info };
    }
    if (req.body.notifications.hr) {
      settings.notifications.hr = { ...settings.notifications.hr, ...req.body.notifications.hr };
    }
  }

  await settings.save();
  res.status(200).json({ success: true, settings });
});
