import { WORK_POLICIES, ROLE_WORK_POLICY } from "../workPolicy.js";

export const getWorkPolicy = (role = "employee") => {
  const policyKey = ROLE_WORK_POLICY[role] || "full_time";
  return WORK_POLICIES[policyKey];
};
// Backend/Attendance/attendance.utils.js
export const nowUTC = () => new Date();

export const capWorkMinutes = (minutes, role = "employee") => {
  const policy = getWorkPolicy(role);
  return Math.min(minutes, policy.maxDailyMinutes);
};

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

export const isWithinOfficeHoursIST = (dateUTC, role = "employee") => {
  const hour = Number(
    dateUTC.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }),
  );

  const policy = getWorkPolicy(role);

  return hour >= policy.officeHours.start && hour < policy.officeHours.end;
};

export const calcWorkMinutes = (record) => {
  if (!record.punchIn) return;

  let total = 0;
  if (record.punches && record.punches.length > 0) {
    total = record.punches.reduce((sum, p) => {
      if (!p.in) return sum;
      const end = p.out ? new Date(p.out) : (record.punchOut ? new Date(record.punchOut) : null);
      if (!end) return sum;
      return sum + Math.max(0, (end.getTime() - new Date(p.in).getTime()) / 60000);
    }, 0);
  } else if (record.punchOut) {
    total = Math.max(0, (new Date(record.punchOut).getTime() - new Date(record.punchIn).getTime()) / 60000);
  } else {
    return;
  }

  const breaks = (record.breaks || []).reduce(
    (sum, b) =>
      sum +
      (b.out && b.in
        ? Math.max(0, (new Date(b.out).getTime() - new Date(b.in).getTime()) / 60000)
        : 0),
    0,
  );

  const net = Math.max(total - breaks, 0);

  record.totalWorkMinutes = Math.floor(total);
  record.totalBreakMinutes = Math.floor(breaks);
  record.netWorkMinutes = capWorkMinutes(Math.floor(net), record.role); // 🔥 CAP HERE
};

/**
 * Checks if a punch-in timestamp is strictly after 10:30:00 AM IST.
 * Strict rule: If an employee logs in / punches in after 10:30 AM IST,
 * it automatically becomes HALF_DAY, regardless of whether they worked late or not.
 * @param {Date|string|number} punchInDate
 * @returns {boolean}
 */
export const isPunchInAfter1030IST = (punchInDate) => {
  if (!punchInDate) return false;
  const d = new Date(punchInDate);
  if (isNaN(d.getTime())) return false;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(d);

  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  const second = parseInt(parts.find((p) => p.type === "second")?.value || "0", 10);

  // 10:30:00 AM IST cutoff = 10 * 3600 + 30 * 60 = 37800 seconds
  const totalSeconds = hour * 3600 + minute * 60 + second;
  return totalSeconds > 37800;
};

export const suggestAttendanceStatus = (minutes, role = "employee", punchIn = null) => {
  // Strict rule: Login after 10:30 AM IST automatically becomes HALF_DAY regardless of working late
  if (punchIn && isPunchInAfter1030IST(punchIn)) {
    return "HALF_DAY";
  }

  const policy = getWorkPolicy(role);

  if (minutes >= policy.attendance.presentMinutes) return "PRESENT";

  if (minutes >= policy.attendance.halfDayMinutes) return "HALF_DAY";

  return "ABSENT";
};

export const calcLiveNetSeconds = (record, now = new Date()) => {
  if (!record?.punchIn) return 0;

  const currentNow = new Date(now);
  let totalSeconds = 0;

  if (record.punches && record.punches.length > 0) {
    totalSeconds = record.punches.reduce((sum, p) => {
      if (!p.in) return sum;
      const end = p.out ? new Date(p.out) : (record.punchOut ? new Date(record.punchOut) : currentNow);
      return sum + Math.max(0, Math.floor((end.getTime() - new Date(p.in).getTime()) / 1000));
    }, 0);
  } else {
    const endTime = record.punchOut ? new Date(record.punchOut) : currentNow;
    totalSeconds = Math.max(0, Math.floor((endTime.getTime() - new Date(record.punchIn).getTime()) / 1000));
  }

  const breakSeconds = (record.breaks || []).reduce((sum, b) => {
    if (!b.in) return sum;
    const breakEnd = b.out ? new Date(b.out) : (record.punchOut ? new Date(record.punchOut) : currentNow);
    return sum + Math.max(0, Math.floor((breakEnd.getTime() - new Date(b.in).getTime()) / 1000));
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
