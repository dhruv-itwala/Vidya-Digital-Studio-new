// Backend/Attendance/attendance.cron.js
import cron from "node-cron";
import WorkRecord from "../workRecord.model.js";
import Attendance from "../attendance.model.js";
import {
  nowUTC,
  todayISTUTC,
  calcWorkMinutes,
  suggestAttendanceStatus,
} from "../utils/attendance.utils.js";

cron.schedule("0 0 * * *", async () => {
  const yesterday = new Date(todayISTUTC().getTime() - 86400000);

  const records = await WorkRecord.find({
    date: yesterday,
    punchIn: { $exists: true },
    punchOut: { $exists: false },
  });

  for (const record of records) {
    // Auto-close at midnight
    record.punchOut = new Date(record.punchIn.getTime() + 8 * 60 * 60 * 1000); // ⏱ cap to 8 hrs

    record.autoClosed = true;
    record.breaks.forEach((b) => !b.out && (b.out = record.punchOut));

    calcWorkMinutes(record);
    await record.save();

    await Attendance.findOneAndUpdate(
      { user: record.user, date: record.date },
      {
        status: "INCOMPLETE", // 🔥 KEY
        source: "SYSTEM",
        remarks: "Auto closed at midnight (forgot punch-out)",
      },
      { upsert: true },
    );
  }
});
