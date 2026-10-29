// Backend/StaffCRM/Attendance/cron/attendance.cron.js
import cron from "node-cron";
import { autoClosePastUnclosedWorkRecords } from "../attendance.service.js";

// Midnight 12:00 AM IST: Auto-close any unclosed work records from yesterday or earlier
cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      console.log("[Cron:Attendance] Running Midnight auto-close for unclosed work records (IST)...");
      const closedCount = await autoClosePastUnclosedWorkRecords();
      console.log(`[Cron:Attendance] Midnight auto-close finished. Closed: ${closedCount} records.`);
    } catch (err) {
      console.error("[Cron:Attendance] Error in midnight auto-close cron:", err);
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);
