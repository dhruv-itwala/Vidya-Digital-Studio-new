// Backend/StaffCRM/utils/date.utils.js

// Get start and end Date objects for a given date string in IST
export const getISTDayRange = (dateStr) => {
  const start = normalizeDate(dateStr); // IST midnight → UTC
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

// Normalize any date to IST midnight (stored as UTC)
export const normalizeDate = (date) => {
  const d = new Date(date);
  // Get 'YYYY-MM-DD' in IST timezone
  const istDateString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  
  return new Date(`${istDateString}T00:00:00+05:30`);
};

// Convert Mongo UTC Date → YYYY-MM-DD in IST
export function toISTDateKey(date) {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Parse YYYY-MM-DD as IST midnight
export function parseIST(dateStr) {
  return new Date(`${dateStr}T00:00:00+05:30`);
}
