import cron from "node-cron";
import { checkWorkReminders } from "../reminder.service.js";
import User from "../../Users/user.model.js";
import WorkRecord from "../workRecord.model.js";
import { todayISTUTC } from "../utils/attendance.utils.js";
import { sendWhatsAppText } from "../../../Whatsapp/whatsapp.sender.js";

cron.schedule("* * * * *", async () => {
  console.log("⏰ Checking work reminders...");

  try {
    await checkWorkReminders();
  } catch (err) {
    console.error("Reminder cron error:", err);
  }
});

cron.schedule(
  "0 10 * * *",
  async () => {
    const users = await User.find({
      role: { $ne: "admin" },
      isActive: true,
    });

    const today = todayISTUTC();

    for (const user of users) {
      const record = await WorkRecord.findOne({
        user: user._id,
        date: today,
      });

      if (!record?.punchIn) {
        await sendWhatsAppText(
          user.phone,
          "⏰ Your shift has started. Please punch in.",
        );
      }
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);
