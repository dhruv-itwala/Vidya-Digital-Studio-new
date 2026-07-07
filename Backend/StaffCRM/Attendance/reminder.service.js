import WorkRecord from "./workRecord.model.js";
import User from "../Users/user.model.js";
import Leave from "../Leaves/leave.model.js";
import Holiday from "../Holidays/holiday.model.js";

import { WORK_POLICIES, ROLE_WORK_POLICY } from "./workPolicy.js";
import { sendWhatsAppText } from "../../Whatsapp/whatsapp.sender.js";
import { todayISTUTC } from "./utils/attendance.utils.js";

export const checkWorkReminders = async () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  const today = todayISTUTC();

  /* ===============================
     HOLIDAY CHECK
  =============================== */

  const isHoliday = await Holiday.exists({ date: today });
  if (isHoliday) return;

  /* ===============================
     USERS
  =============================== */

  const users = await User.find({
    isActive: true,
    role: { $ne: "admin" },
  }).select("_id name phone role");

  for (const user of users) {
    /* ===============================
       LEAVE CHECK
    =============================== */

    const leave = await Leave.exists({
      user: user._id,
      status: "APPROVED",
      fromDate: { $lte: today },
      toDate: { $gte: today },
    });

    if (leave) continue;

    const policyKey = ROLE_WORK_POLICY[user.role];
    const policy = WORK_POLICIES[policyKey];

    if (!policy) continue;

    const start = policy.officeHours.start;
    const end = policy.officeHours.end;

    const record = await WorkRecord.findOne({
      user: user._id,
      date: today,
    });

    /* ===============================
       1️⃣ PUNCH IN REMINDER
       Start + 1 minute
    =============================== */

    if (hour === start && minute === 1) {
      if (!record?.punchIn && !record?.punchInReminderSent) {
        await sendWhatsAppText(
          user.phone,
          "⏰ Your shift has started. Please punch in.",
        );

        if (record) {
          record.punchInReminderSent = true;
          await record.save();
        }
      }
    }

    /* ===============================
       2️⃣ REPORT REMINDER
       30 minutes before shift end
    =============================== */

    if (hour === end - 1 && minute === 30) {
      if (
        record?.punchIn &&
        !record?.reportSubmitted &&
        !record?.reportReminderSent
      ) {
        await sendWhatsAppText(
          user.phone,
          "📝 Please submit your daily report before shift ends.",
        );

        record.reportReminderSent = true;
        await record.save();
      }
    }

    /* ===============================
       3️⃣ PUNCH OUT REMINDER
       1 hour after shift end
    =============================== */

    if (hour === end + 1 && minute === 0) {
      if (
        record?.punchIn &&
        !record?.punchOut &&
        !record?.punchOutReminderSent
      ) {
        await sendWhatsAppText(
          user.phone,
          "😄 Your shift is over. Please punch out.",
        );

        record.punchOutReminderSent = true;
        await record.save();
      }
    }

    /* ===============================
       4️⃣ BREAK REMINDERS
    =============================== */

    if (hour === 12 && minute === 30) {
      const hasStartedBreak = record?.breaks?.length > 0;

      if (
        record?.punchIn &&
        !record?.punchOut &&
        !hasStartedBreak &&
        !record?.breakTakeReminderSent
      ) {
        await sendWhatsAppText(
          user.phone,
          "🍽️ It's 12:30 PM. Please remember to take your break and mark it in the CRM.",
        );

        record.breakTakeReminderSent = true;
        await record.save();
      }
    }

    if (record?.breaks?.length) {
      const lastBreak = record.breaks.at(-1);

      if (lastBreak && !lastBreak.out) {
        const breakMinutes = (now - new Date(lastBreak.in)) / 60000;

        /* 10 minutes left */

        if (breakMinutes >= 50 && !record.breakEndReminderSent) {
          await sendWhatsAppText(
            user.phone,
            "⏳ Only 10 minutes left for your break.",
          );

          record.breakEndReminderSent = true;
          await record.save();
        }

        /* break exceeded */

        if (breakMinutes >= 60 && !record.breakOvertimeAlertSent) {
          await sendWhatsAppText(
            user.phone,
            "⚠️ Break time exceeded. Please resume work.",
          );

          record.breakOvertimeAlertSent = true;
          await record.save();
        }
      }
    }
  }
};
