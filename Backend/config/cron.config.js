import cron from "node-cron";

// Attendance crons
import "../StaffCRM/Attendance/cron/attendance.cron.js";
// Reminder crons
import "../StaffCRM/Attendance/cron/reminder.cron.js";
// Holiday crons
import "../StaffCRM/Attendance/cron/attendanceHoliday.cron.js";
// Leave crons
import "../StaffCRM/leaveBalance/leaveCredit.cron.js";
// Weekly Progress crons
import "../StaffCRM/Attendance/cron/weeklyProgress.cron.js";

console.log("🕒 Cron jobs initialized");

// Optional: monitor cron health
cron.schedule("*/10 * * * *", () => {
  console.log("💓 Cron heartbeat", new Date().toISOString());
});
