export const nowUTC = () => new Date();

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

  record.totalWorkMinutes = Math.floor(total);
  record.totalBreakMinutes = Math.floor(breaks);
  record.netWorkMinutes = Math.max(
    record.totalWorkMinutes - record.totalBreakMinutes,
    0
  );
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
