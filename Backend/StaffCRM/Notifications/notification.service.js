import webpush from "web-push";
import NotificationSubscription from "./notification.model.js";
import { logActivity } from "../AuditLog/AuditLog.service.js";
import User from "../Users/user.model.js";

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
    try {
      const targetUser = await User.findById(userId).select("name email role").lean();
      const targetName = targetUser ? targetUser.name || targetUser.email : "Unknown User";
      await logActivity({
        user: targetUser ? { id: targetUser._id, name: targetUser.name, role: targetUser.role } : { id: userId, name: "System", role: "system" },
        category: "System",
        module: "Notifications",
        action: "SEND_PUSH",
        entityId: userId,
        entityName: targetName,
        description: `Push notification '${title}' skipped for ${targetName} (0 registered devices)`,
        metadata: { title, body, url, sentCount: 0, reason: "No active push subscriptions found" },
        status: "FAILED",
      });
    } catch (err) {
      console.error("Audit log error in sendNotification:", err.message);
    }

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

  try {
    const targetUser = await User.findById(userId).select("name email role").lean();
    const targetName = targetUser ? targetUser.name || targetUser.email : "Unknown User";
    await logActivity({
      user: targetUser ? { id: targetUser._id, name: targetUser.name, role: targetUser.role } : { id: userId, name: "System", role: "system" },
      category: "System",
      module: "Notifications",
      action: "SEND_PUSH",
      entityId: userId,
      entityName: targetName,
      description: `Sent push notification '${title}' to ${targetName} (${sentCount}/${subscriptions.length} device(s))`,
      metadata: { title, body, url, sentCount, totalDevices: subscriptions.length },
      status: sentCount > 0 ? "SUCCESS" : "FAILED",
    });
  } catch (err) {
    console.error("Audit log error in sendNotification:", err.message);
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

