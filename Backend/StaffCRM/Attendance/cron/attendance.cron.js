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
  }).lean();

  if (records.length === 0) return;

  const workRecordOps = [];
  const attendanceOps = [];

  for (const record of records) {
    // Auto-close at midnight
    record.punchOut = new Date(record.punchIn.getTime() + 8 * 60 * 60 * 1000); // ⏱ cap to 8 hrs

    record.autoClosed = true;
    record.breaks.forEach((b) => !b.out && (b.out = record.punchOut));

    calcWorkMinutes(record);

    workRecordOps.push({
      updateOne: {
        filter: { _id: record._id },
        update: { $set: record },
      },
    });

    attendanceOps.push({
      updateOne: {
        filter: { user: record.user, date: record.date },
        update: {
          $set: {
            status: "INCOMPLETE", // 🔥 KEY
            source: "SYSTEM",
            remarks: "Auto closed at midnight (forgot punch-out)",
          },
        },
        upsert: true,
      },
    });
  }

  // Execute bulk writes concurrently
  await Promise.all([
    WorkRecord.bulkWrite(workRecordOps),
    Attendance.bulkWrite(attendanceOps),
  ]);
});
