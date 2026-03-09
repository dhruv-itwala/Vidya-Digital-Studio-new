import cron from "node-cron";
import { checkWorkReminders } from "./reminder.service.js";

cron.schedule("* * * * *", async () => {
  console.log("⏰ Checking work reminders...");

  try {
    await checkWorkReminders();
  } catch (err) {
    console.error("Reminder cron error:", err);
  }
});
