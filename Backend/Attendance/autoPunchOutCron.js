import cron from "node-cron";
import attendanceModel from "../models/attendance.model.js";
import {
  getISTDayStart,
  recalcMinutes,
  calcStatus,
} from "../utils/attendance.utils.js";

cron.schedule("0 0 * * *", async () => {
  const yesterday = getISTDayStart(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const records = await attendanceModel.find({
    date: yesterday,
    "sessions.out": { $exists: false },
  });

  for (const att of records) {
    const session = att.sessions.at(-1);
    if (session && !session.out) {
      session.out = new Date(yesterday.getTime() + 86400000);
    }

    const lastBreak = att.breaks.at(-1);
    if (lastBreak && !lastBreak.out) {
      lastBreak.out = session.out;
    }

    recalcMinutes(att);
    att.status = calcStatus(att.totalMinutes);
    await att.save();
  }
});
