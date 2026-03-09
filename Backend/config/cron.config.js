import cron from "node-cron";

// Attendance crons
import "../StaffCRM/Attendance/attendance.cron.js";
// Reminder crons
// import "../StaffCRM/Attendance/reminder.cron.js";
// Holiday crons
import "../StaffCRM/Attendance/attendanceHoliday.cron.js";
// Leave crons
import "../StaffCRM/leaveBalance/leaveCredit.cron.js";
// Weekly Progress crons
import "../StaffCRM/Attendance/weeklyProgress.cron.js";

console.log("🕒 Cron jobs initialized");

// Optional: monitor cron health
cron.schedule("*/10 * * * *", () => {
  console.log("💓 Cron heartbeat", new Date().toISOString());
});
