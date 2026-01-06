import { useEffect, useMemo, useState } from "react";
import { getAllLeavesAPI } from "../../api/leave.api";
import { getHolidaysAPI } from "../../api/holiday.api";
import styles from "./LeaveCalendar.module.css";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function LeaveCalendar() {
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const normalize = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  /* ================= FETCH ================= */
  useEffect(() => {
    const load = async () => {
      const [leaveRes, holidayRes] = await Promise.all([
        getAllLeavesAPI(),
        getHolidaysAPI(),
      ]);

      setLeaves((leaveRes.data || []).filter((l) => l.status === "APPROVED"));
      setHolidays(holidayRes.data || []);
    };

    load();
  }, []);

  /* ================= DATE SETUP ================= */
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const daysInMonth = lastDay.getDate();
  const startDayIndex = firstDay.getDay();

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < startDayIndex; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [year, month, daysInMonth, startDayIndex]);

  /* ================= HELPERS ================= */
  const sameDay = (a, b) => a.toDateString() === b.toDateString();

  const leavesForDate = (date) => {
    if (!date) return [];

    const current = normalize(date);

    return leaves.filter((l) => {
      const from = normalize(new Date(l.fromDate));
      const to = normalize(new Date(l.toDate));
      return current >= from && current <= to;
    });
  };

  const holidayForDate = (date) => {
    if (!date) return null;
    return holidays.find((h) => sameDay(new Date(h.date), date));
  };

  /* ================= UI ================= */
  return (
    <div className={styles.wrapper}>
      {/* ===== Header ===== */}
      <div className={styles.header}>
        <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
          ←
        </button>

        <h2>
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>

        <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
          →
        </button>
      </div>

      {/* ===== Week Row ===== */}
      <div className={styles.weekRow}>
        {WEEK_DAYS.map((d) => (
          <div key={d} className={styles.weekDay}>
            {d}
          </div>
        ))}
      </div>

      {/* ===== Calendar Grid ===== */}
      <div className={styles.grid}>
        {calendarDays.map((date, idx) => {
          const holiday = holidayForDate(date);
          const dailyLeaves = leavesForDate(date);

          return (
            <div
              key={idx}
              className={`${styles.cell} ${holiday ? styles.holidayCell : ""}`}
            >
              {date && (
                <>
                  <div className={styles.date}>{date.getDate()}</div>

                  {holiday && (
                    <div className={styles.holidayLabel}>🎉 {holiday.name}</div>
                  )}

                  <div className={styles.leaves}>
                    {dailyLeaves.map((l) => (
                      <div
                        key={l._id}
                        className={`${styles.leave} ${styles[l.type]} ${
                          l.isHalfDay ? styles.halfDay : ""
                        }`}
                        title={`${l.user.name} • ${l.type}${
                          l.isHalfDay ? " (Half Day)" : ""
                        }`}
                      >
                        <span className={styles.leaveName}>{l.user.name}</span>

                        {l.isHalfDay && (
                          <span className={styles.halfBadge}>🌓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
