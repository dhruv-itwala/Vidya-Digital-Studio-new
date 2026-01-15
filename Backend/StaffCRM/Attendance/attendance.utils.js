// Backend/Attendance/attendance.utils.js
export const nowUTC = () => new Date();

// Cap work minutes to 8 hours
const MAX_WORK_MINUTES = 8 * 60;
export const capWorkMinutes = (minutes) => Math.min(minutes, MAX_WORK_MINUTES);

// YYYY-MM-DD (IST) → UTC midnight
export const parseISTDateOnly = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0) - 5.5 * 60 * 60 * 1000);
};

// Today IST → UTC
export const todayISTUTC = () =>
  parseISTDateOnly(
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
  );

export const isWithinOfficeHoursIST = (dateUTC) => {
  const hour = Number(
    dateUTC.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    })
  );
  return hour >= 10 && hour < 19;
};

export const calcWorkMinutes = (record) => {
  if (!record.punchIn || !record.punchOut) return;

  const total = (record.punchOut - record.punchIn) / 60000;
  const breaks = record.breaks.reduce(
    (sum, b) => sum + (b.out && b.in ? (b.out - b.in) / 60000 : 0),
    0
  );

  const net = Math.max(total - breaks, 0);

  record.totalWorkMinutes = Math.floor(total);
  record.totalBreakMinutes = Math.floor(breaks);
  record.netWorkMinutes = capWorkMinutes(Math.floor(net)); // 🔥 CAP HERE
};

export const suggestAttendanceStatus = (minutes) => {
  if (minutes >= 480) return "PRESENT";
  if (minutes >= 240) return "HALF_DAY";
  return "ABSENT";
};

export const calcLiveNetSeconds = (record, now = new Date()) => {
  if (!record?.punchIn) return 0;

  const endTime = record.punchOut ?? now;

  const totalSeconds = Math.floor((endTime - record.punchIn) / 1000);

  const breakSeconds = record.breaks.reduce((sum, b) => {
    if (!b.in) return sum;
    const breakEnd = b.out ?? endTime;
    return sum + Math.floor((breakEnd - b.in) / 1000);
  }, 0);

  return Math.max(totalSeconds - breakSeconds, 0);
};

export const calcLiveBreakSeconds = (record, now = new Date()) => {
  if (!record?.breaks) return 0;

  return record.breaks.reduce((sum, b) => {
    if (!b.in) return sum;
    const end = b.out || now;
    return sum + Math.floor((end - new Date(b.in)) / 1000);
  }, 0);
};

import workRecordModel from "./workRecord.model.js";

export const getTodayWorkRecordService = async (userId) => {
  const today = todayISTUTC();
  const yesterday = new Date(today.getTime() - 86400000);

  let record = await workRecordModel.findOne({
    user: userId,
    date: today,
  });

  if (!record) {
    record = await workRecordModel.findOne({
      user: userId,
      date: yesterday,
      punchOut: { $exists: false },
    });
  }

  if (!record) return null;

  const lastBreak = record.breaks.at(-1);
  const onBreak = lastBreak && !lastBreak.out;

  return {
    ...record.toObject(),
    liveNetSeconds: calcLiveNetSeconds(record),
    serverNow: new Date(),
    isRunning: !!record.punchIn && !record.punchOut && !onBreak,
    onBreak,
  };
};
