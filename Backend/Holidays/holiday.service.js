import attendanceModel from "../Attendance/attendance.model.js";
import userModel from "../Users/user.model.js";
import { normalizeDate } from "../utils/date.utils.js";
import holidayModel from "./holiday.model.js";

export const getAllHolidaysService = async () => {
  return holidayModel.find().sort({ date: 1 });
};

export const getUpcomingHolidaysService = async () => {
  const today = normalizeDate(new Date());

  return holidayModel
    .find({
      date: { $gte: today },
    })
    .sort({ date: 1 });
};

export const updateHolidayService = async (id, data) => {
  return holidayModel.findByIdAndUpdate(id, data, { new: true });
};

export const isHolidayService = async (date) => {
  return holidayModel.exists({ date });
};

export const createHolidayService = async (data) => {
  const date = normalizeDate(data.date);

  // 1️⃣ Create holiday
  const holiday = await holidayModel.create({
    ...data,
    date,
  });

  // 2️⃣ Fetch all employees (exclude admin)
  const users = await userModel.find({ role: { $ne: "admin" } });

  // 3️⃣ Create / update attendance as HOLIDAY
  for (const user of users) {
    await attendanceModel.findOneAndUpdate(
      { user: user._id, date },
      {
        status: "HOLIDAY",
        source: "SYSTEM",
        remarks: holiday.name,
      },
      { upsert: true }
    );
  }

  return holiday;
};

export const deleteHolidayService = async (id) => {
  const holiday = await holidayModel.findById(id);
  if (!holiday) return null;

  const date = holiday.date;

  // Revert HOLIDAY attendance to ABSENT (or delete)
  await attendanceModel.updateMany(
    { date, status: "HOLIDAY" },
    { status: "ABSENT" }
  );

  return holidayModel.findByIdAndDelete(id);
};
