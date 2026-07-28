import { saveSubscription, sendNotification } from "./notification.service.js";
import {
  checkPunchInReminder,
  checkActiveShiftReminders,
  checkNightPunchOutReminder,
} from "../Attendance/attendanceReminder.service.js";

/**
 * Save Browser Push Subscription
 * POST /api/notifications/subscribe
 */
export const subscribe = async (req, res, next) => {
  try {
    const subscription = req.body;
    const userId = req.user.id || req.user._id;

    await saveSubscription(userId, subscription);

    return res.status(200).json({
      success: true,
      message: "Notification subscription saved successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Test Notification
 * POST /api/notifications/test
 */
export const testNotification = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const result = await sendNotification(userId, {
      title: "🎉 Staff CRM",
      body: "Push notifications are working successfully on your device!",
      url: "/",
    });

    if (!result || result.count === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No active notification subscriptions found for your account. Please click Enable Notifications first.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Test notification sent to ${result.count} device(s).`,
      count: result.count,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger Reminders Manually (For Testing/Admin)
 * POST /api/notifications/trigger-reminders
 */
export const triggerReminders = async (req, res, next) => {
  try {
    const { type } = req.body;

    if (type === "punchIn") {
      const result = await checkPunchInReminder();
      return res.status(200).json({ success: true, result });
    }

    if (type === "nightPunchOut") {
      const result = await checkNightPunchOutReminder();
      return res.status(200).json({ success: true, result });
    }

    // Default: activeShift
    const result = await checkActiveShiftReminders();
    return res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

