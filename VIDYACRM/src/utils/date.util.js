export const getDueStatus = (endDate) => {
  if (!endDate) return null;

  const today = new Date().setHours(0, 0, 0, 0);
  const due = new Date(endDate).setHours(0, 0, 0, 0);

  if (due < today) return "passed";
  if (due === today) return "today";
  return "upcoming";
};

export const holidayGetDayName = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
  });
};

export const holidayFormatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatToIST = (utcDate) => {
  if (!utcDate) return "-";

  return new Date(utcDate).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatISTDate = (date) => {
  if (!date) return "-";

  const d = new Date(date);
  const ist = new Date(d.getTime() + 330 * 60000);

  const day = String(ist.getUTCDate()).padStart(2, "0");
  const month = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const year = ist.getUTCFullYear();

  return `${day}/${month}/${year}`;
};
