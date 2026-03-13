import cron from "node-cron";

import { checkWorkReminders } from "../reminder.service.js";

import User from "../../Users/user.model.js";
import Holiday from "../../Holidays/holiday.model.js";

import { sendWhatsAppText } from "../../../Whatsapp/whatsapp.sender.js";
import { todayISTUTC } from "../utils/attendance.utils.js";

/* =====================================
   WORK REMINDERS (EVERY MINUTE)
===================================== */

cron.schedule(
  "* * * * *",
  async () => {
    try {
      await checkWorkReminders();
    } catch (err) {
      console.error("Reminder cron error:", err);
    }
  },
  { timezone: "Asia/Kolkata" },
);

/* =====================================
   HOLIDAY WISH (12:00 AM)
===================================== */

cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      const today = todayISTUTC();

      const holiday = await Holiday.findOne({ date: today });

      if (!holiday) return;

      const users = await User.find({
        role: { $ne: "admin" },
        isActive: true,
      });

      for (const user of users) {
        await sendWhatsAppText(
          user.phone,
          `🎉 Today is *${holiday.name}*. Enjoy your holiday!`,
        );
      }

      console.log("🎉 Holiday wishes sent");
    } catch (err) {
      console.error("Holiday cron error:", err);
    }
  },
  { timezone: "Asia/Kolkata" },
);

/* =====================================
   BIRTHDAY WISHES (9:00 AM)
===================================== */

cron.schedule(
  "0 9 * * *",
  async () => {
    try {
      const today = new Date();

      const users = await User.find({
        isActive: true,
      });

      const todayMonth = today.getMonth();
      const todayDate = today.getDate();

      for (const user of users) {
        if (!user.dateOfBirth) continue;

        const dob = new Date(user.dateOfBirth);

        if (dob.getMonth() === todayMonth && dob.getDate() === todayDate) {
          await sendWhatsAppText(
            user.phone,
            `🎂 Happy Birthday ${user.name}! 🎉

Wishing you a wonderful year ahead!`,
          );
        }
      }

      console.log("🎂 Birthday wishes sent");
    } catch (err) {
      console.error("Birthday cron error:", err);
    }
  },
  { timezone: "Asia/Kolkata" },
);
