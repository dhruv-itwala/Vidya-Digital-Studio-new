import webpush from "web-push";
import NotificationSubscription from "./notification.model.js";

// Ensure Web Push is configured before sending
const ensureVapidConfigured = () => {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    throw new Error("VAPID keys are not configured in environment variables.");
  }
  webpush.setVapidDetails(
    "mailto:admin@vidyadigitalstudio.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
};

/**
 * Save or Update Push Subscription
 */
export const saveSubscription = async (userId, subscription) => {
  // Remove subscription if this same browser endpoint was previously used by another user
  await NotificationSubscription.deleteMany({
    endpoint: subscription.endpoint,
    user: { $ne: userId },
  });

  return await NotificationSubscription.findOneAndUpdate(
    {
      user: userId,
      endpoint: subscription.endpoint,
    },
    {
      user: userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );
};

/**
 * Remove invalid subscription
 */
export const removeSubscription = async (endpoint) => {
  await NotificationSubscription.deleteOne({
    endpoint,
  });
};

/**
 * Send Push Notification
 */
export const sendNotification = async (
  userId,
  { title, body, url = "/", icon = "/icon-192.png", badge = "/icon-192.png" },
) => {
  ensureVapidConfigured();

  const subscriptions = await NotificationSubscription.find({
    user: userId,
  });

  if (!subscriptions.length) {
    return {
      success: false,
      count: 0,
      message: "No active push subscriptions found.",
    };
  }

  const payload = JSON.stringify({
    title,
    body,
    url,
    icon,
    badge,
  });

  let sentCount = 0;
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        payload,
      );
      sentCount++;
    } catch (error) {
      console.error("Push Notification Error:", error.statusCode, error.message);

      // Browser subscription expired or invalid
      if (error.statusCode === 404 || error.statusCode === 410) {
        await removeSubscription(subscription.endpoint);
      }
    }
  }

  return {
    success: sentCount > 0,
    count: sentCount,
    message:
      sentCount > 0
        ? "Notification sent successfully."
        : "Failed to send notification to active devices.",
  };
};
