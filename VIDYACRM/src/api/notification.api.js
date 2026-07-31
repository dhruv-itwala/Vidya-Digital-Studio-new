import api from "./axios";

export const subscribeToNotificationsAPI = (subscription) =>
  api.post("/notifications/subscribe", subscription);

export const sendTestNotificationAPI = () => api.post("/notifications/test");

export const triggerRemindersAPI = (type = "all") =>
  api.post("/notifications/trigger-reminders", { type });

