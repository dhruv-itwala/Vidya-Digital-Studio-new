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
  d.setMinutes(d.getMinutes() + 330); // UTC → IST
  d.setHours(0, 0, 0, 0); // IST midnight
  d.setMinutes(d.getMinutes() - 330); // IST → UTC
  return d;
};

// Convert Mongo UTC Date → YYYY-MM-DD in IST
export function toISTDateKey(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + 330);
  return d.toISOString().slice(0, 10);
}

// Parse YYYY-MM-DD as IST midnight
export function parseIST(dateStr) {
  return new Date(`${dateStr}T00:00:00+05:30`);
}
