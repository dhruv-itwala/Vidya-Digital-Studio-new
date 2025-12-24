export const getDueStatus = (endDate) => {
  if (!endDate) return null;

  const today = new Date().setHours(0, 0, 0, 0);
  const due = new Date(endDate).setHours(0, 0, 0, 0);

  if (due < today) return "passed";
  if (due === today) return "today";
  return "upcoming";
};
