// attendanceHoliday.cron.js
import cron from "node-cron";
import { todayISTUTC } from "../utils/attendance.utils.js";
import holidayModel from "../../Holidays/holiday.model.js";
import userModel from "../../Users/user.model.js";
import attendanceModel from "../attendance.model.js";
import { getISTDayRange } from "../../utils/date.utils.js";

cron.schedule(
  "0 0 * * *",
  async () => {
    const today = todayISTUTC();
    const { start, end } = getISTDayRange(today);
    const isHoliday = await holidayModel.findOne({ date: { $gte: start, $lt: end } });

    if (!isHoliday) return;

    const users = await userModel.find({ isActive: true });

    for (const user of users) {
      await attendanceModel.findOneAndUpdate(
        { user: user._id, date: today },
        {
          status: "HOLIDAY",
          source: "SYSTEM",
          remarks: isHoliday.name,
        },
        { upsert: true },
      );
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);
