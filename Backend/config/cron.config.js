import cron from "node-cron";

/* ================================
   ATTENDANCE SYSTEM
================================ */

import "../StaffCRM/Attendance/cron/attendance.cron.js";
import "../StaffCRM/Attendance/cron/reminder.cron.js";
import "../StaffCRM/Attendance/cron/attendanceHoliday.cron.js";
import "../StaffCRM/Attendance/cron/weeklyProgress.cron.js";

/* ================================
   LEAVE SYSTEM
================================ */

import "../StaffCRM/leaveBalance/leaveCredit.cron.js";

/* ================================
   SYSTEM HEALTH
================================ */

console.log("🕒 All cron jobs initialized");

/* Heartbeat Monitor */
cron.schedule(
  "*/10 * * * *",
  () => {
    console.log("💓 Cron heartbeat", new Date().toISOString());
  },
  {
    timezone: "Asia/Kolkata",
  },
);
