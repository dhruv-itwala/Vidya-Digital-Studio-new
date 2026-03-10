import NotificationLog from "./notification.model.js";

export const getNotificationsService = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    NotificationLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    NotificationLog.countDocuments(),
  ]);

  return {
    total,
    page,
    limit,
    logs,
  };
};
