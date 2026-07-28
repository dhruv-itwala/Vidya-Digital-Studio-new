import { saveSubscription, sendNotification } from "./notification.service.js";

/**
 * Save Browser Push Subscription
 * POST /api/notifications/subscribe
 */
export const subscribe = async (req, res, next) => {
  try {
    const subscription = req.body;

    await saveSubscription(req.user._id, subscription);

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
    const result = await sendNotification(req.user._id, {
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
