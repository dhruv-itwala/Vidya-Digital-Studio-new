import WorkRecord from "./workRecord.model.js";
import { getWorkPolicy } from "./utils/attendance.utils.js";
import { sendWhatsAppText } from "../../Whatsapp/whatsapp.sender.js";

export const checkWorkReminders = async () => {
  const records = await WorkRecord.find({
    punchIn: { $exists: true },
    punchOut: { $exists: false },
  }).populate("user");

  const now = new Date();

  for (const record of records) {
    const user = record.user;
    if (!user || !user.phone) continue;

    const policy = getWorkPolicy(user.role);

    const requiredMinutes = policy.dailyHours * 60;
    const workedMinutes = record.netWorkMinutes || 0;

    const remaining = requiredMinutes - workedMinutes;

    const lastBreak = record.breaks.at(-1);
    const onBreak = lastBreak && !lastBreak.out;

    let updated = false;

    /* ================= BREAK REMINDER ================= */

    if (workedMinutes >= requiredMinutes * 0.5 && !record.breakReminderSent) {
      await sendWhatsAppText(user.phone, "🍵 Don't forget to take your break.");

      record.breakReminderSent = true;
      updated = true;
    }

    /* ================= BREAK END REMINDER ================= */

    if (onBreak) {
      const breakMinutes = (now - new Date(lastBreak.in)) / 60000;

      if (breakMinutes >= 50 && !record.breakEndReminderSent) {
        await sendWhatsAppText(
          user.phone,
          "⏳ 10 minutes left for your break.",
        );

        record.breakEndReminderSent = true;
        updated = true;
      }

      if (breakMinutes >= 65 && !record.breakOvertimeAlertSent) {
        await sendWhatsAppText(
          user.phone,
          "⚠️ Break time exceeded. Please break out.",
        );

        record.breakOvertimeAlertSent = true;
        updated = true;
      }
    }

    /* ================= REPORT REMINDER ================= */

    if (remaining <= 30 && !record.reportReminderSent) {
      await sendWhatsAppText(user.phone, "📝 Please submit today's report.");

      record.reportReminderSent = true;
      updated = true;
    }

    /* ================= WORK COMPLETE ================= */

    if (remaining <= 0 && !record.workCompletedSent) {
      await sendWhatsAppText(
        user.phone,
        "🎉 Your working hours are completed.",
      );

      record.workCompletedSent = true;
      updated = true;
    }

    /* ================= PUNCH OUT REMINDER ================= */

    if (workedMinutes >= requiredMinutes + 60 && !record.punchOutReminderSent) {
      await sendWhatsAppText(
        user.phone,
        "😄 Enough for today. Please punch out.",
      );

      record.punchOutReminderSent = true;
      updated = true;
    }

    /* ================= SAVE ONCE ================= */

    if (updated) {
      await record.save();
    }
  }
};
