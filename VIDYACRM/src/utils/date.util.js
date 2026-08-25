export const getDueStatus = (endDate) => {
  if (!endDate) return null;

  const now = new Date();
  const due = new Date(endDate);
  if (isNaN(due.getTime())) return null;

  if (due.getTime() + 60000 <= now.getTime()) return "passed";
  const today = new Date().setHours(0, 0, 0, 0);
  const dueDay = new Date(endDate).setHours(0, 0, 0, 0);
  if (dueDay === today) return "today";
  return "upcoming";
};

export const isTaskOverdue = (endDate, status) => {
  if (!endDate) return false;
  if (status === "complete") return false;
  const due = new Date(endDate);
  if (isNaN(due.getTime())) return false;
  return (due.getTime() + 60000) <= new Date().getTime();
};

export const holidayGetDayName = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  });
};

export const holidayFormatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatToIST = (utcDate, includeTime = true) => {
  if (!utcDate) return "-";
  const d = new Date(utcDate);
  if (isNaN(d.getTime())) return "-";

  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime && {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  });
};

export const formatISTDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatISTTime = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Converts UTC ISO string or Date to 'YYYY-MM-DDTHH:mm' string in Asia/Kolkata for <input type="datetime-local" />
 */
export const toLocalDatetimeInput = (utcDate) => {
  if (!utcDate) return "";
  const d = new Date(utcDate);
  if (isNaN(d.getTime())) return "";

  // Explicitly format in Asia/Kolkata timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(d);
  const getPart = (type) => parts.find((p) => p.type === type)?.value || "00";
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  let hour = getPart("hour");
  if (hour === "24") hour = "00";
  const minute = getPart("minute");

  return `${year}-${month}-${day}T${hour}:${minute}`;
};

/**
 * Converts 'YYYY-MM-DDTHH:mm' from <input type="datetime-local" /> to UTC ISO string for backend
 * interpreting the user input strictly as Indian Standard Time (IST: UTC+05:30)
 */
export const fromLocalDatetimeInput = (datetimeStr) => {
  if (!datetimeStr) return null;
  let isoInput = datetimeStr;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetimeStr)) {
    isoInput = `${datetimeStr}:00+05:30`;
  }
  const d = new Date(isoInput);
  if (isNaN(d.getTime())) {
    const fallback = new Date(datetimeStr);
    return isNaN(fallback.getTime()) ? null : fallback.toISOString();
  }
  return d.toISOString();
};
