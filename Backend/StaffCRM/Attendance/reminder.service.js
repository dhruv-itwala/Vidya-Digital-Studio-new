import WorkRecord from "./workRecord.model.js";
import User from "../Users/user.model.js";
import Leave from "../Leaves/leave.model.js";
import Holiday from "../Holidays/holiday.model.js";

import { WORK_POLICIES, ROLE_WORK_POLICY } from "./workPolicy.js";

import { sendEmployeeTemplate } from "../../Whatsapp/whatsapp.sender.js";

import { todayISTUTC } from "./utils/attendance.utils.js";

/* =====================================
   CURRENT IST TIME
===================================== */

const getCurrentISTTime = () => {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  return {
    hour: Number(parts.find((part) => part.type === "hour")?.value),

    minute: Number(parts.find((part) => part.type === "minute")?.value),
  };
};

/* =====================================
   SAFE REMINDER SENDER
===================================== */

const sendReminder = async (user, message, reminderType) => {
  try {
    const result = await sendEmployeeTemplate(user.phone, user.name, message);

    console.log(`✅ ${reminderType} accepted`, {
      user: user.name,
      phone: user.phone,
      messageId: result?.messages?.[0]?.id,
    });

    return true;
  } catch (error) {
    console.error(`❌ ${reminderType} failed`, {
      user: user.name,
      phone: user.phone,
      error: error.response?.data || error.message,
    });

    return false;
  }
};

/* =====================================
   WORK REMINDER ENGINE
===================================== */

export const checkWorkReminders = async () => {
  const now = new Date();

  const { hour, minute } = getCurrentISTTime();

  const today = todayISTUTC();

  /* =====================================
     HOLIDAY CHECK
  ===================================== */

  const isHoliday = await Holiday.exists({
    date: today,
  });

  if (isHoliday) {
    return;
  }

  /* =====================================
     ACTIVE USERS
  ===================================== */

  const users = await User.find({
    isActive: true,

    role: {
      $ne: "admin",
    },
  }).select("_id name phone role");

  /* =====================================
     PROCESS USERS
  ===================================== */

  for (const user of users) {
    try {
      if (!user.phone) {
        console.log(`⚠️ Phone missing: ${user.name}`);

        continue;
      }

      /* =====================================
         LEAVE CHECK
      ===================================== */

      const leave = await Leave.exists({
        user: user._id,

        status: "APPROVED",

        fromDate: {
          $lte: today,
        },

        toDate: {
          $gte: today,
        },
      });

      if (leave) {
        continue;
      }

      /* =====================================
         WORK POLICY
      ===================================== */

      const policyKey = ROLE_WORK_POLICY[user.role];

      const policy = WORK_POLICIES[policyKey];

      if (!policy) {
        continue;
      }

      const start = policy.officeHours.start;

      const end = policy.officeHours.end;

      /* =====================================
         TODAY RECORD
      ===================================== */

      let record = await WorkRecord.findOne({
        user: user._id,
        date: today,
      });

      /* =====================================
         1. PUNCH IN REMINDER
      ===================================== */

      if (hour === start && minute === 1) {
        if (!record?.punchIn && !record?.punchInReminderSent) {
          const sent = await sendReminder(
            user,

            "⏰ Your shift has started. Please punch in for today's shift.",

            "PUNCH_IN",
          );

          if (sent) {
            /*
              Important:

              Previously, if no WorkRecord existed,
              reminder flag was never saved.

              Now create the record if necessary.
            */

            if (!record) {
              record = await WorkRecord.findOneAndUpdate(
                {
                  user: user._id,
                  date: today,
                },

                {
                  $setOnInsert: {
                    user: user._id,
                    date: today,
                  },

                  $set: {
                    punchInReminderSent: true,
                  },
                },

                {
                  new: true,
                  upsert: true,
                },
              );
            } else {
              record.punchInReminderSent = true;

              await record.save();
            }
          }
        }
      }

      /* =====================================
         2. BREAK TAKE REMINDER
         12:30 PM IST
      ===================================== */

      if (hour === 12 && minute === 30) {
        const hasStartedBreak = record?.breaks?.length > 0;

        if (
          record?.punchIn &&
          !record?.punchOut &&
          !hasStartedBreak &&
          !record?.breakTakeReminderSent
        ) {
          const sent = await sendReminder(
            user,

            "🍽️ It is time for your scheduled break. Please start your break and update it in the VDS CRM.",

            "BREAK_TAKE",
          );

          if (sent) {
            record.breakTakeReminderSent = true;

            await record.save();
          }
        }
      }

      /* =====================================
         3. REPORT REMINDER
      ===================================== */

      if (hour === end - 1 && minute === 30) {
        if (
          record?.punchIn &&
          !record?.reportSubmitted &&
          !record?.reportReminderSent
        ) {
          const sent = await sendReminder(
            user,

            "📝 Your daily work report is pending. Please submit it before completing your workday.",

            "REPORT",
          );

          if (sent) {
            record.reportReminderSent = true;

            await record.save();
          }
        }
      }

      /* =====================================
         4. PUNCH OUT REMINDER
      ===================================== */

      if (hour === end + 1 && minute === 0) {
        if (
          record?.punchIn &&
          !record?.punchOut &&
          !record?.punchOutReminderSent
        ) {
          const sent = await sendReminder(
            user,

            "😄 Your workday has ended. Please punch out in the VDS CRM.",

            "PUNCH_OUT",
          );

          if (sent) {
            record.punchOutReminderSent = true;

            await record.save();
          }
        }
      }

      /* =====================================
         5. ACTIVE BREAK REMINDERS
      ===================================== */

      if (record?.breaks?.length) {
        const lastBreak = record.breaks.at(-1);

        if (lastBreak && !lastBreak.out) {
          const breakMinutes =
            (now.getTime() - new Date(lastBreak.in).getTime()) / 60000;

          /* =================================
             10 MINUTES LEFT
          ================================= */

          if (
            breakMinutes >= 50 &&
            breakMinutes < 60 &&
            !record.breakEndReminderSent
          ) {
            const sent = await sendReminder(
              user,

              "⏳ Your break will end in 10 minutes. Please prepare to resume work.",

              "BREAK_ENDING",
            );

            if (sent) {
              record.breakEndReminderSent = true;

              await record.save();
            }
          }

          /* =================================
             BREAK EXCEEDED
          ================================= */

          if (breakMinutes >= 60 && !record.breakOvertimeAlertSent) {
            const sent = await sendReminder(
              user,

              "⚠️ Your scheduled break time has ended. Please resume work and update your break status.",

              "BREAK_EXCEEDED",
            );

            if (sent) {
              record.breakOvertimeAlertSent = true;

              await record.save();
            }
          }
        }
      }
    } catch (error) {
      /*
        One employee failure must not stop
        notifications for remaining employees.
      */

      console.error(
        `❌ Reminder processing error for ${user.name}:`,
        error.response?.data || error.message,
      );
    }
  }
};
