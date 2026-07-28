// Backend/StaffCRM/Attendance/attendanceReminder.service.js
import User from "../Users/user.model.js";
import WorkRecord from "./workRecord.model.js";
import {
  todayISTUTC,
  calcLiveBreakSeconds,
  calcLiveNetSeconds,
} from "./utils/attendance.utils.js";
import { sendNotification } from "../Notifications/notification.service.js";

/**
 * 1. 10:01 AM IST: Check users who have not punched in today
 */
export const checkPunchInReminder = async () => {
  try {
    const today = todayISTUTC();
    const activeUsers = await User.find({
      isActive: true,
      role: { $in: ["employee", "hr", "intern"] },
    }).lean();

    let notifiedCount = 0;

    for (const user of activeUsers) {
      try {
        const record = await WorkRecord.findOne({
          user: user._id,
          date: today,
        });

        // If no record or record has no punchIn and reminder not sent yet
        if (!record?.punchIn && !record?.punchInReminderSent) {
          const result = await sendNotification(user._id, {
            title: "⏰ Shift Has Started!",
            body: "It is 10:01 AM. Your shift has officially started. Please punch in now to avoid late attendance!",
            url: "/",
          });

          if (result?.success) {
            notifiedCount++;
          }

          // Mark reminder sent so we don't spam if check runs again
          await WorkRecord.findOneAndUpdate(
            { user: user._id, date: today },
            {
              $set: {
                user: user._id,
                date: today,
                punchInReminderSent: true,
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );
        }
      } catch (err) {
        console.error(`Error sending punchIn reminder to user ${user._id}:`, err?.message || err);
      }
    }

    console.log(`[Reminder] 10:01 AM Punch-In Reminder checked. Notified: ${notifiedCount}`);
    return { success: true, notifiedCount };
  } catch (error) {
    console.error("[Reminder] Error in checkPunchInReminder:", error);
    return { success: false, error: error?.message };
  }
};

/**
 * 2. Active Shift Reminders (Runs every 1 min)
 * - Break 50 mins (10 mins left in 1 hr break)
 * - Break 60 mins (Break time is up)
 * - Report 450 mins net work (30 mins before 8 hr shift end)
 * - Shift Completed 480 mins net work (8 hrs completed)
 */
export const checkActiveShiftReminders = async () => {
  try {
    const today = todayISTUTC();

    // Find all records for today where punched in and NOT punched out
    const records = await WorkRecord.find({
      date: today,
      punchIn: { $exists: true },
      punchOut: { $exists: false },
    });

    let remindersSent = 0;

    for (const record of records) {
      try {
        let changed = false;

        // Calculate live break minutes & live net work minutes
        const breakSec = calcLiveBreakSeconds(record);
        const breakMinutes = Math.floor(breakSec / 60);

        const netSec = calcLiveNetSeconds(record);
        const netMinutes = Math.floor(netSec / 60);

        const currentlyOnBreak =
          record.breaks?.length > 0 &&
          record.breaks[record.breaks.length - 1].in &&
          !record.breaks[record.breaks.length - 1].out;

        // --- A. Break 50-minute Reminder (10 mins left in 1 hour break) ---
        if (
          currentlyOnBreak &&
          breakMinutes >= 50 &&
          breakMinutes < 60 &&
          !record.breakReminderSent
        ) {
          const res = await sendNotification(record.user, {
            title: "⏳ 10 Minutes Left in Break!",
            body: "You have 10 minutes remaining in your 1-hour break. Please prepare to resume work.",
            url: "/",
          });
          record.breakReminderSent = true;
          changed = true;
          if (res?.success) remindersSent++;
        }

        // --- B. Break 60-minute Reminder (Break time is up) ---
        if (
          currentlyOnBreak &&
          breakMinutes >= 60 &&
          !record.breakEndReminderSent
        ) {
          const res = await sendNotification(record.user, {
            title: "🚨 Break Time is Up!",
            body: "Your 1-hour break has ended. Please end your break and resume work now!",
            url: "/",
          });
          record.breakEndReminderSent = true;
          changed = true;
          if (res?.success) remindersSent++;
        }

        // --- C. Submit Report Reminder (30 mins before shift completion -> 450 net mins) ---
        if (
          netMinutes >= 450 &&
          netMinutes < 480 &&
          !record.reportSubmitted &&
          !record.reportReminderSent
        ) {
          const res = await sendNotification(record.user, {
            title: "📝 Submit Your Daily Report",
            body: "30 minutes remaining in your shift! Please submit your work report before punching out.",
            url: "/reports",
          });
          record.reportReminderSent = true;
          changed = true;
          if (res?.success) remindersSent++;
        }

        // --- D. Shift Completed Reminder (8 hours completed -> 480 net mins) ---
        if (netMinutes >= 480 && !record.workCompletedSent) {
          const res = await sendNotification(record.user, {
            title: "🎉 Shift Completed - Punch Out!",
            body: "You have completed 8 hours of work today. Don't forget to punch out!",
            url: "/",
          });
          record.workCompletedSent = true;
          changed = true;
          if (res?.success) remindersSent++;
        }

        if (changed) {
          await record.save();
        }
      } catch (err) {
        console.error(
          `Error checking active shift reminders for user ${record.user}:`,
          err?.message || err,
        );
      }
    }

    return { success: true, remindersSent };
  } catch (error) {
    console.error("[Reminder] Error in checkActiveShiftReminders:", error);
    return { success: false, error: error?.message };
  }
};

/**
 * 3. 10:00 PM IST: Check for users who did not punch out
 */
export const checkNightPunchOutReminder = async () => {
  try {
    const today = todayISTUTC();
    const records = await WorkRecord.find({
      date: today,
      punchIn: { $exists: true },
      punchOut: { $exists: false },
      punchOutReminderSent: { $ne: true },
    });

    let notifiedCount = 0;

    for (const record of records) {
      try {
        const res = await sendNotification(record.user, {
          title: "⚠️ Punch Out Reminder!",
          body: "It is 10:00 PM. Please punch out now! Otherwise your shift will be marked INCOMPLETE at midnight.",
          url: "/",
        });

        record.punchOutReminderSent = true;
        await record.save();

        if (res?.success) notifiedCount++;
      } catch (err) {
        console.error(
          `Error sending 10 PM punch-out reminder to user ${record.user}:`,
          err?.message || err,
        );
      }
    }

    console.log(`[Reminder] 10:00 PM Punch-Out Reminder checked. Notified: ${notifiedCount}`);
    return { success: true, notifiedCount };
  } catch (error) {
    console.error("[Reminder] Error in checkNightPunchOutReminder:", error);
    return { success: false, error: error?.message };
  }
};
