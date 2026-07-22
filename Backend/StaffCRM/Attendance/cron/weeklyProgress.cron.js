import cron from "node-cron";
import WorkRecord from "../workRecord.model.js";
import weeklyWork from "../weeklyWork.model.js";
import User from "../../Users/user.model.js";
import Holiday from "../../Holidays/holiday.model.js";

import { getCurrentWeekRangeIST } from "../utils/attendance.utils.js";

cron.schedule("59 23 * * *", async () => {
  console.log("Running Weekly Progress Cron");

  const { weekStartUTC, weekEndUTC } = getCurrentWeekRangeIST();

  const users = await User.find({
    role: { $ne: "admin" },
    isActive: true,
  }).lean();

  // ===== FIND HOLIDAYS =====
  const holidays = await Holiday.find({
    date: { $gte: weekStartUTC, $lte: weekEndUTC },
  }).lean();

  let holidayCount = 0;

  for (const h of holidays) {
    const day = new Date(h.date).getUTCDay();
    if (day !== 0 && day !== 6) {
      holidayCount++;
    }
  }

  const requiredSeconds = (48 - holidayCount * 8) * 60 * 60;

  // Batch process users to prevent MongoDB connection saturation
  const BATCH_SIZE = 15;
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (user) => {
        const records = await WorkRecord.find({
          user: user._id,
          date: { $gte: weekStartUTC, $lte: weekEndUTC },
        }).lean();

        let totalSeconds = 0;

        for (const record of records) {
          if (!record.punchIn) continue;

          const endTime = record.punchOut ?? new Date();

          const workedSeconds = Math.floor((endTime - record.punchIn) / 1000);

          totalSeconds += workedSeconds;
        }

        const weekFinished = new Date() > weekEndUTC;

        let status = "IN_PROGRESS";

        if (totalSeconds >= requiredSeconds) {
          status = "COMPLETED";
        } else if (weekFinished) {
          status = "DEFICIT";
        }

        const totalMinutes = Math.floor(totalSeconds / 60);

        await weeklyWork.findOneAndUpdate(
          {
            user: user._id,
            weekStart: weekStartUTC,
          },
          {
            weekEnd: weekEndUTC,
            totalMinutes,
            requiredMinutes: requiredSeconds / 60,
            status,
          },
          { upsert: true }
        );
      })
    );
  }

  console.log("Weekly Progress Cron Completed");
});
