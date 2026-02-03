import cron from "node-cron";

// Attendance crons
import "../StaffCRM/Attendance/attendance.cron.js";
// Holiday crons
import "../StaffCRM/Attendance/attendanceHoliday.cron.js";
// Leave crons
import "../StaffCRM/leaveBalance/leaveCredit.cron.js";

console.log("🕒 Cron jobs initialized");

// Optional: monitor cron health
cron.schedule("*/10 * * * *", () => {
  console.log("💓 Cron heartbeat", new Date().toISOString());
});
