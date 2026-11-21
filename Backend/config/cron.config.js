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

/* ================================
   AI ASSISTANT KEEP-ALIVE
================================ */
cron.schedule(
  "*/10 * * * *",
  async () => {
    try {
      const baseUrl = process.env.AI_BASE_URL || "https://itwala-dhruv-delta.hf.space";
      await fetch(`${baseUrl}/ping`, { method: "GET" }).catch(() => {});
    } catch (e) {
      // Non-blocking ping
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

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
