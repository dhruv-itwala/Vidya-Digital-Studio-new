import cron from "node-cron";

/* ================================
   ATTENDANCE SYSTEM
================================ */

import "../StaffCRM/Attendance/cron/attendance.cron.js";
import "../StaffCRM/Attendance/cron/attendanceHoliday.cron.js";
import "../StaffCRM/Attendance/cron/weeklyProgress.cron.js";
import "../StaffCRM/Attendance/cron/attendanceReminder.cron.js";

/* ================================
   LEAVE SYSTEM
================================ */

/* ================================
   TASK SYSTEM
================================ */
import "../StaffCRM/Tasks/cron/contentTaskReminder.cron.js";

/* ================================
   SYSTEM HEALTH
================================ */

console.log("🕒 All cron jobs initialized");

/* Heartbeat Monitor: runs hourly to avoid log spam */
cron.schedule(
  "0 * * * *",
  () => {
    console.log("💓 Cron heartbeat (hourly check)", new Date().toISOString());
  },
  {
    timezone: "Asia/Kolkata",
  },
);
