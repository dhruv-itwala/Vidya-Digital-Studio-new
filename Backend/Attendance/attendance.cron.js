import cron from "node-cron";
import WorkRecord from "./workRecord.model.js";
import Attendance from "./attendance.model.js";
import {
  nowUTC,
  todayISTUTC,
  calcWorkMinutes,
  suggestAttendanceStatus,
} from "./attendance.utils.js";

cron.schedule("0 0 * * *", async () => {
  const yesterday = new Date(todayISTUTC().getTime() - 86400000);

  const records = await WorkRecord.find({
    date: yesterday,
    punchOut: { $exists: false },
  });

  for (const r of records) {
    r.punchOut = nowUTC();
    r.autoClosed = true;
    r.breaks.forEach((b) => !b.out && (b.out = r.punchOut));
    calcWorkMinutes(r);
    await r.save();

    await Attendance.findOneAndUpdate(
      { user: r.user, date: yesterday },
      {
        status: suggestAttendanceStatus(r.netWorkMinutes),
        source: "SYSTEM",
      },
      { upsert: true }
    );
  }
});
