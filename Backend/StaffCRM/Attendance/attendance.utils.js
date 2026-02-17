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
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
  );

export const isWithinOfficeHoursIST = (dateUTC) => {
  const hour = Number(
    dateUTC.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }),
  );
  return hour >= 8 && hour < 19;
};

export const calcWorkMinutes = (record) => {
  if (!record.punchIn || !record.punchOut) return;

  const total = (record.punchOut - record.punchIn) / 60000;
  const breaks = record.breaks.reduce(
    (sum, b) => sum + (b.out && b.in ? (b.out - b.in) / 60000 : 0),
    0,
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

// export const getCurrentWeekRangeIST = () => {
//   const now = new Date();

//   const istNow = new Date(
//     now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
//   );

//   const day = istNow.getDay(); // 0=Sun, 1=Mon

//   const diffToMonday = (day === 0 ? -6 : 1) - day;

//   const mondayIST = new Date(istNow);
//   mondayIST.setDate(istNow.getDate() + diffToMonday);
//   mondayIST.setHours(0, 0, 0, 0);

//   const sundayIST = new Date(mondayIST);
//   sundayIST.setDate(mondayIST.getDate() + 6);
//   sundayIST.setHours(23, 59, 59, 999);

//   return {
//     weekStartUTC: new Date(mondayIST.toISOString()),
//     weekEndUTC: new Date(sundayIST.toISOString()),
//   };
// };

export const getCurrentWeekRangeIST = () => {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5h30m in ms

  const nowUTC = new Date();
  const nowIST = new Date(nowUTC.getTime() + IST_OFFSET);

  const day = nowIST.getUTCDay(); // use UTC getters after manual shift

  const diffToMonday = (day === 0 ? -6 : 1) - day;

  const mondayIST = new Date(nowIST);
  mondayIST.setUTCDate(nowIST.getUTCDate() + diffToMonday);
  mondayIST.setUTCHours(0, 0, 0, 0);

  const sundayIST = new Date(mondayIST);
  sundayIST.setUTCDate(mondayIST.getUTCDate() + 6);
  sundayIST.setUTCHours(23, 59, 59, 999);

  // convert back to pure UTC timestamps
  const weekStartUTC = new Date(mondayIST.getTime() - IST_OFFSET);
  const weekEndUTC = new Date(sundayIST.getTime() - IST_OFFSET);

  return {
    weekStartUTC,
    weekEndUTC,
  };
};
