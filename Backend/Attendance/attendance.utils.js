export const getISTNow = () => {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
};

export const getISTDayStart = (date = new Date()) => {
  const d = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  d.setHours(0, 0, 0, 0);
  return d;
};

export const isWithinOfficeHours = (date) => {
  const hour = date.getHours(); // IST hour
  return hour >= 10 && hour < 19;
};

export const recalcMinutes = (attendance) => {
  let work = 0;
  let breaks = 0;

  attendance.sessions.forEach((s) => {
    if (s.in && s.out) work += s.out - s.in;
  });

  attendance.breaks.forEach((b) => {
    if (b.in && b.out) breaks += b.out - b.in;
  });

  attendance.totalMinutes = Math.max(Math.floor((work - breaks) / 60000), 0);
};

export const calcStatus = (minutes) => {
  if (minutes >= 480) return "PRESENT"; // 8 hrs
  if (minutes >= 240) return "HALF_DAY"; // 4 hrs
  return "ABSENT";
};
