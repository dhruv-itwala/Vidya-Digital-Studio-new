// attendanceHoliday.cron.js
import cron from "node-cron";
import { todayISTUTC } from "./attendance.utils.js";
import holidayModel from "../Holidays/holiday.model.js";
import userModel from "../Users/user.model.js";
import attendanceModel from "./attendance.model.js";

cron.schedule("0 0 * * *", async () => {
  const today = todayISTUTC();
  const isHoliday = await holidayModel.findOne({ date: today });

  if (!isHoliday) return;

  const users = await userModel.find({ role: { $ne: "admin" } });

  for (const user of users) {
    await attendanceModel.findOneAndUpdate(
      { user: user._id, date: today },
      {
        status: "HOLIDAY",
        source: "SYSTEM",
        remarks: isHoliday.name,
      },
      { upsert: true }
    );
  }
});
