// Backend/Attendance/autoPunchout.cron.js
import cron from "node-cron";
import WorkRecord from "./workRecord.model.js";
import Attendance from "./attendance.model.js";
import {
  nowUTC,
  calcLiveNetSeconds,
  suggestAttendanceStatus,
} from "./attendance.utils.js";

const MAX_NET_SECONDS = 8 * 60 * 60; // 8 hours
const existing = await Attendance.findOne({ user: r.user, date });

cron.schedule("*/5 * * * *", async () => {
  const runningRecords = await WorkRecord.find({
    punchIn: { $exists: true },
    punchOut: { $exists: false },
  });
  cron.schedule("*/5 * * * *", async () => {
    console.log("🕒 Auto punch-out cron running", new Date().toISOString());
  });

  for (const record of runningRecords) {
    const netSeconds = calcLiveNetSeconds(record);

    if (netSeconds >= MAX_NET_SECONDS) {
      record.punchOut = nowUTC();
      record.autoClosed = true;

      // close open breaks
      record.breaks.forEach((b) => !b.out && (b.out = record.punchOut));

      record.totalWorkMinutes = Math.floor(netSeconds / 60);
      record.netWorkMinutes = record.totalWorkMinutes;

      await record.save();

      if (!existing || !["LEAVE", "HOLIDAY"].includes(existing.status)) {
        await Attendance.findOneAndUpdate(
          { user: r.user, date },
          {
            status: suggestAttendanceStatus(r.netWorkMinutes),
            source: "SYSTEM",
          },
          { upsert: true }
        );
      }
    }
  }
});
