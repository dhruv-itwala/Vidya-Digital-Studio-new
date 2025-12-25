export const normalizeDate = (date) =>
  new Date(new Date(date).setHours(0, 0, 0, 0));
