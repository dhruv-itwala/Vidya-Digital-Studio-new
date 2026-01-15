// Backend/Holidays/holiday.service.js

import Attendance from "../Attendance/attendance.model.js";
import User from "../Users/user.model.js";
import Holiday from "./holiday.model.js";
import { normalizeDate } from "../utils/date.utils.js";
import AppError from "../utils/AppError.js";

// =============== ALL HOLIDAYS =======================
export const getAllHolidaysService = async () => {
  return Holiday.find().sort({ date: 1 });
};

// =============== UPCOMING HOLIDAYS =======================
export const getUpcomingHolidaysService = async () => {
  const today = normalizeDate(new Date());

  return Holiday.find({
    date: { $gte: today },
  }).sort({ date: 1 });
};

// =============== CHECK IF HOLIDAY =======================
export const isHolidayService = async (date) => {
  const day = normalizeDate(date);
  return Holiday.exists({ date: day });
};

// ============= CREATE ======================
export const createHolidayService = async (data) => {
  if (!data?.date || !data?.name) {
    throw new AppError("Holiday date and name are required", 400);
  }

  const date = normalizeDate(data.date);

  // 🔒 Prevent duplicate holiday
  const exists = await Holiday.exists({ date });
  if (exists) {
    throw new AppError("Holiday already exists for this date", 409);
  }

  // 1️⃣ Create holiday
  const holiday = await Holiday.create({
    ...data,
    date,
  });

  // 2️⃣ Fetch all non-admin users
  const users = await User.find({ role: { $ne: "admin" } }).select("_id");

  if (!users.length) return holiday;

  // 3️⃣ Bulk mark attendance as HOLIDAY
  const ops = users.map((user) => ({
    updateOne: {
      filter: { user: user._id, date },
      update: {
        status: "HOLIDAY",
        source: "SYSTEM",
        remarks: holiday.name,
      },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(ops);

  return holiday;
};

// ============= UPDATE ======================
export const updateHolidayService = async (id, data) => {
  if (!id) throw new AppError("Holiday id is required", 400);

  const holiday = await Holiday.findById(id);
  if (!holiday) {
    throw new AppError("Holiday not found", 404);
  }

  // Normalize date if updated
  if (data.date) {
    data.date = normalizeDate(data.date);
  }

  return Holiday.findByIdAndUpdate(id, data, { new: true });
};

// ============= DELETE ======================
export const deleteHolidayService = async (id) => {
  if (!id) throw new AppError("Holiday id is required", 400);

  const holiday = await Holiday.findById(id);
  if (!holiday) {
    throw new AppError("Holiday not found", 404);
  }

  const date = holiday.date;

  // Revert attendance entries created by this holiday
  await Attendance.updateMany(
    {
      date,
      status: "HOLIDAY",
      source: "SYSTEM",
    },
    {
      status: "ABSENT",
      remarks: null,
    }
  );

  await Holiday.findByIdAndDelete(id);

  return { message: "Holiday deleted successfully" };
};
