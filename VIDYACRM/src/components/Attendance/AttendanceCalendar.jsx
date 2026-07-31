import { useMemo } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
    // Fill remaining days to make a perfect grid (multiple of 7)
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 0; i < remainingDays; i++) days.push(null);
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
        <div className={styles.monthSelector}>
          <button
            className={styles.navBtn}
            onClick={() => onMonthChange(new Date(year, month - 1, 1))}
          >
            <FiChevronLeft />
          </button>
          <h2>
            {currentMonth.toLocaleString("default", { month: "long" })}
            <span className={styles.yearHighlight}> {year}</span>
          </h2>
          <button
            className={styles.navBtn}
            onClick={() => onMonthChange(new Date(year, month + 1, 1))}
          >
            <FiChevronRight />
          </button>
        </div>
        <div className={styles.statusLegend}>
          <span className={styles.legendItem}><span className={styles.dotPresent}></span> Present</span>
          <span className={styles.legendItem}><span className={styles.dotHalfDay}></span> Halfday</span>
          <span className={styles.legendItem}><span className={styles.dotIncomplete}></span> Incomplete</span>
          <span className={styles.legendItem}><span className={styles.dotAbsent}></span> Absent</span>
          <span className={styles.legendItem}><span className={styles.dotLeave}></span> Leave</span>
          <span className={styles.legendItem}><span className={styles.dotHoliday}></span> Holiday</span>
        </div>
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
          if (!date) {
            return <div key={idx} className={`${styles.emptyCell} ${styles.mobileHidden}`}></div>;
          }

          const record = attendanceForDate(date);
          const statusClass = record ? styles[record.status.toLowerCase()] : "";

          return (
            <div
              key={idx}
              className={`${styles.cell} ${statusClass} ${isToday(date) ? styles.today : ""}`}
              title={record?.remarks || record?.status || ""}
            >
              <div className={styles.dateNumber}>
                <span className={styles.mobileDayName}>{WEEK_DAYS[date.getDay()]}</span>
                {date.getDate()}
              </div>
              {record && (
                <div className={styles.statusBadge}>{record.status.toUpperCase()}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
