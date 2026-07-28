// Backend/StaffCRM/Attendance/cron/attendanceReminder.cron.js
import cron from "node-cron";
import {
  checkPunchInReminder,
  checkActiveShiftReminders,
  checkNightPunchOutReminder,
} from "../attendanceReminder.service.js";

// 1. 10:01 AM IST - Check for users who have not punched in
cron.schedule(
  "1 10 * * *",
  async () => {
    console.log("[Cron:Reminder] Running 10:01 AM Punch-In check...");
    await checkPunchInReminder();
  },
  {
    timezone: "Asia/Kolkata",
  },
);

// 2. Every 1 Minute - Check active shift reminders (Break 10-min left, Break Over, Report 30-min left, Shift Complete)
cron.schedule(
  "* * * * *",
  async () => {
    await checkActiveShiftReminders();
  },
  {
    timezone: "Asia/Kolkata",
  },
);

// 3. 10:00 PM IST - Check for users who did not punch out yet
cron.schedule(
  "0 22 * * *",
  async () => {
    console.log("[Cron:Reminder] Running 10:00 PM Punch-Out check...");
    await checkNightPunchOutReminder();
  },
  {
    timezone: "Asia/Kolkata",
  },
);

console.log("🔔 Attendance Reminder cron jobs initialized");
