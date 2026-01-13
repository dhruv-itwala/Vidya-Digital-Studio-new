export const normalizeDate = (date) =>
  new Date(new Date(date).setHours(0, 0, 0, 0));

// Always converts a Mongo Date → "YYYY-MM-DD" in IST
export function toISTDateKey(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + 330); // convert UTC → IST
  return d.toISOString().slice(0, 10);
}

// Parses frontend "2026-01-10" safely
export function parseIST(dateStr) {
  return new Date(dateStr + "T00:00:00+05:30");
}
