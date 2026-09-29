import User from "../Users/user.model.js";
import WorkRecord from "./workRecord.model.js";
import Holiday from "../Holidays/holiday.model.js";
import Leave from "../Leaves/leave.model.js";
import {
  todayISTUTC,
  calcLiveBreakSeconds,
  calcLiveNetSeconds,
} from "./utils/attendance.utils.js";
import { sendNotification } from "../Notifications/notification.service.js";

/**
 * 1. 10:01 AM IST: Check users who have not punched in today
 */
export const checkPunchInReminder = async (force = false) => {
  try {
    // 1. Guard against Sunday (Weekly off)
    const istDayOfWeek = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    }).format(new Date());

    if (istDayOfWeek === "Sun") {
      console.log("[Reminder] Today is Sunday (Weekly off). Skipping punch-in reminders.");
      return { success: true, notifiedCount: 0, reason: "Sunday" };
    }

    // 2. Guard against time outside morning shift window (09:00 - 13:00 IST)
    const istHour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: false,
      }).format(new Date()),
    );

    if (!force && (istHour < 9 || istHour >= 13)) {
      console.log(`[Reminder] Current IST hour (${istHour}) is outside shift start window (09:00 - 13:00). Skipping punch-in reminder.`);
      return { success: true, notifiedCount: 0, reason: "Outside shift start window" };
    }

    const today = todayISTUTC();

    // 3. Guard against Company Holidays
    const isHoliday = await Holiday.exists({ date: today });
    if (isHoliday) {
      console.log("[Reminder] Today is a company holiday. Skipping punch-in reminders.");
      return { success: true, notifiedCount: 0, reason: "Company holiday" };
    }

    // 4. Batch query users, leaves, and today's work records concurrently
    const [activeUsers, leavesToday, recordsToday] = await Promise.all([
      User.find({
        isActive: true,
        role: { $in: ["employee", "hr", "intern"] },
      }).select("_id name").lean(),
      Leave.find({
        status: "APPROVED",
        fromDate: { $lte: today },
        toDate: { $gte: today },
        isHalfDay: false,
      }).select("user").lean(),
      WorkRecord.find({
        date: today,
      }).select("user punchIn punchInReminderSent").lean(),
    ]);

    const userIdsOnLeave = new Set(leavesToday.map((l) => l.user.toString()));
    const recordMap = new Map(recordsToday.map((r) => [r.user.toString(), r]));

    // Filter in-memory: eligible users who haven't punched in and need a reminder
    const targetUsers = activeUsers.filter((u) => {
      if (userIdsOnLeave.has(u._id.toString())) return false;
      const rec = recordMap.get(u._id.toString());
      return !rec?.punchIn && (!rec?.punchInReminderSent || force);
    });

    if (targetUsers.length === 0) {
      console.log("[Reminder] 10:01 AM Punch-In check completed: 0 users need reminder.");
      return { success: true, notifiedCount: 0 };
    }

    // Send push notifications concurrently
    const sendResults = await Promise.allSettled(
      targetUsers.map((user) =>
        sendNotification(user._id, {
          title: "⏰ Shift Has Started!",
          body: "It is 10:01 AM. Your shift has officially started. Please punch in now to avoid late attendance!",
          url: "/",
          ttl: 7200, // Discard after 2 hours if offline/asleep
        })
      )
    );

    let notifiedCount = 0;
    const notifiedUserIds = [];

    sendResults.forEach((res, index) => {
      if (res.status === "fulfilled" && res.value?.success) {
        notifiedCount++;
      }
      notifiedUserIds.push(targetUsers[index]._id);
    });

    // Bulk update work records in a single database operation
    if (notifiedUserIds.length > 0) {
      const bulkOps = notifiedUserIds.map((userId) => ({
        updateOne: {
          filter: { user: userId, date: today },
          update: {
            $set: {
              user: userId,
              date: today,
              punchInReminderSent: true,
            },
          },
          upsert: true,
        },
      }));
      await WorkRecord.bulkWrite(bulkOps, { ordered: false });
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

    if (!records.length) return { success: true, remindersSent: 0 };

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
            ttl: 600, // 10 min TTL
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
            ttl: 900, // 15 min TTL
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
            ttl: 1800, // 30 min TTL
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
            ttl: 3600, // 1 hr TTL
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

    if (!records.length) return { success: true, notifiedCount: 0 };

    let notifiedCount = 0;

    for (const record of records) {
      try {
        const res = await sendNotification(record.user, {
          title: "⚠️ Punch Out Reminder!",
          body: "It is 10:00 PM. Please punch out now! Otherwise your shift will be marked INCOMPLETE at midnight.",
          url: "/",
          ttl: 7200, // Expires by midnight
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

/**
 * 4. Admin/HR manual trigger: Send appropriate active reminder to ALL active users
 */
export const sendRemindersToAllUsers = async () => {
  try {
    const istDayOfWeek = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    }).format(new Date());

    const istHour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: false,
      }).format(new Date()),
    );

    const today = todayISTUTC();
    const [isHoliday, activeUsers, recordsToday] = await Promise.all([
      Holiday.exists({ date: today }),
      User.find({ isActive: true }).select("_id").lean(),
      WorkRecord.find({ date: today }).lean(),
    ]);

    const recordMap = new Map(recordsToday.map((r) => [r.user.toString(), r]));
    const tasks = [];

    for (const user of activeUsers) {
      const record = recordMap.get(user._id.toString());

      let title = "⏰ Shift Reminder";
      let body = "Please remember to mark your attendance and follow shift timings!";

      if (!record || !record.punchIn) {
        // If Sunday or holiday, never send shift started reminder
        if (istDayOfWeek === "Sun" || isHoliday) continue;

        // Only send "Shift Has Started" if during morning/start hours (09:00 - 14:00 IST)
        if (istHour >= 9 && istHour < 14) {
          title = "⏰ Shift Has Started!";
          body = "Your shift has started. Please punch in now to avoid late attendance!";
        } else {
          // Afternoon or night: NEVER send "shift has started" to someone who hasn't punched in
          continue;
        }
      } else if (record.punchIn && !record.punchOut) {
        const currentlyOnBreak =
          record.breaks?.length > 0 &&
          record.breaks[record.breaks.length - 1].in &&
          !record.breaks[record.breaks.length - 1].out;

        if (currentlyOnBreak) {
          title = "⏳ Break Reminder";
          body = "You are currently on break. Remember your 1-hour break limit and resume work on time.";
        } else {
          title = "📋 Active Shift Reminder";
          body = "You are currently on shift. Remember to submit your work report 30 minutes before punching out!";
        }
      } else if (record.punchOut) {
        title = "✅ Shift Completed";
        body = "You have completed your shift for today. Have a great evening!";
      }

      tasks.push(
        sendNotification(user._id, {
          title,
          body,
          url: "/",
          ttl: 3600,
        })
      );
    }

    const results = await Promise.allSettled(tasks);
    let notifiedCount = 0;
    for (const res of results) {
      if (res.status === "fulfilled" && res.value?.success) notifiedCount++;
    }

    return { success: true, notifiedCount, totalUsers: activeUsers.length };
  } catch (error) {
    console.error("[Reminder] Error in sendRemindersToAllUsers:", error);
    return { success: false, error: error?.message };
  }
};
