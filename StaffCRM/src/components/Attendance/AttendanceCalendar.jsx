import { useMemo } from "react";
import styles from "./AttendanceCalendar.module.css";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const normalize = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export default function AttendanceCalendar({
  records,
  currentMonth,
  onMonthChange,
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDayIndex = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const isToday = (date) => {
    if (!date) return false;
    return normalize(date) === normalize(new Date());
  };

  /* ================= CALENDAR DAYS ================= */
  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < startDayIndex; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [year, month, startDayIndex, daysInMonth]);

  /* ================= HELPERS ================= */
  const attendanceForDate = (date) => {
    if (!date) return null;
    const current = normalize(date);

    return records.find((r) => {
      const recordDate = normalize(new Date(r.date));
      return recordDate === current;
    });
  };

  /* ================= UI ================= */
  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <div className={styles.header}>
        <button
          className={styles.navBtn}
          onClick={() => onMonthChange(new Date(year, month - 1, 1))}
        >
          ←
        </button>

        <h2>
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>

        <button
          className={styles.navBtn}
          onClick={() => onMonthChange(new Date(year, month + 1, 1))}
        >
          →
        </button>
      </div>

      {/* WEEK HEADER */}
      <div className={styles.weekRow}>
        {WEEK_DAYS.map((d) => (
          <div key={d} className={styles.weekDay}>
            {d}
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className={styles.grid}>
        {calendarDays.map((date, idx) => {
          const record = attendanceForDate(date);

          return (
            <div
              key={idx}
              className={`${styles.cell} 
    ${record ? styles[record.status.toLowerCase()] : ""}
    ${isToday(date) ? styles.today : ""}
  `}
              title={record?.remarks || record?.status || ""}
            >
              {date && (
                <>
                  <div className={styles.date}>{date.getDate()}</div>
                  {record && (
                    <div className={styles.statusText}>{record.status}</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
