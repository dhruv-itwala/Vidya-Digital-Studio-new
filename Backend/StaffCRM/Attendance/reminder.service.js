import WorkRecord from "./workRecord.model.js";
import User from "../Users/user.model.js";
import { sendWhatsAppText } from "../../Whatsapp/whatsapp.sender.js";

export const checkWorkReminders = async () => {
  const records = await WorkRecord.find({
    punchIn: { $exists: true },
    punchOut: { $exists: false },
  });

  for (const record of records) {
    const user = await User.findById(record.user);

    const workedMinutes = record.netWorkMinutes;
    const requiredMinutes = 480; // 8 hours

    const remaining = requiredMinutes - workedMinutes;

    if (!record.reportReminderSent) {
      await sendWhatsAppText(
        user.phone,
        "🧪 TEST: Reminder system working! Please submit today's report.",
      );

      record.reportReminderSent = true;
      await record.save();
    }

    // 30 minute reminder
    if (remaining <= 30 && !record.reportReminderSent) {
      await sendWhatsAppText(
        user.phone,
        "⏰ You have 30 minutes left. Please submit today's report.",
      );

      record.reportReminderSent = true;
      await record.save();
    }

    // work completed reminder
    if (remaining <= 0 && !record.punchOutReminderSent) {
      await sendWhatsAppText(
        user.phone,
        "✅ Your work hours are completed. Please punch out.",
      );

      record.punchOutReminderSent = true;
      await record.save();
    }
  }
};
