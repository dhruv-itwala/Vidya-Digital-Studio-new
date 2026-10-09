import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  getAllEmployeesAttendanceAPI,
  getLiveEmployeesStatusAPI,
  getAllEmployeesAttendanceByDateRangeAPI,
  markAttendanceStatusAPI,
  downloadAttendancePDFAPI,
  getAllUsersWeeklyProgressAPI,
} from "../../api/attendance.api";

import { FaUsers, FaCalendarDay, FaCalendarAlt } from "react-icons/fa";
import { IoChevronDown } from "react-icons/io5";

import styles from "./Attendance.module.css";
import toast from "react-hot-toast";
import Loader from "../../components/Loader/Loader";

export default function Attendance() {
  /* ================= DATES (IST SAFE) ================= */
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const [date, setDate] = useState(today);
  const [liveDate, setLiveDate] = useState(today);

  /* ================= STATE ================= */
  const [daily, setDaily] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  const [live, setLive] = useState([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [range, setRange] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);

  const [open, setOpen] = useState({
    daily: false,
    live: false,
    range: false,
    weekly: false,
  });

  const liveFetchRef = useRef(null);
  const liveTickRef = useRef(null);

  const [weeklyFrom, setWeeklyFrom] = useState("");
  const [weekly, setWeekly] = useState([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  const toggle = (k) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  /* ================= HELPERS ================= */

  const formatTime = (d) => {
    if (!d) return "--";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "--";
    return dt.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  };

  const formatMinutes = (m = 0) => {
    if (!m || m <= 0) return "0m";
    const h = Math.floor(m / 60);
    const mins = Math.round(m % 60);
    if (h === 0) return `${mins}m`;
    if (mins === 0) return `${h}h`;
    return `${h}h ${mins}m`;
  };

  const formatDuration = (s = 0) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}h ${String(
      Math.floor((s % 3600) / 60),
    ).padStart(2, "0")}m`;

  /* ================= DAILY ================= */
  const fetchDaily = useCallback(async (silent = false) => {
    try {
      if (!silent) setDailyLoading(true);
      const res = await getAllEmployeesAttendanceAPI(date);
      setDaily(res.data?.data || []);
    } catch {
      if (!silent) toast.error("Failed to load attendance");
    } finally {
      if (!silent) setDailyLoading(false);
    }
  }, [date]);

  useEffect(() => {
    if (open.daily) fetchDaily();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, open.daily]);

  const updateStatus = async (id, status) => {
    try {
      await markAttendanceStatusAPI({ userId: id, date, status });
      setDaily((p) => p.map((e) => (e._id === id ? { ...e, status } : e)));
      toast.success("Updated");
    } catch {
      toast.error("Update failed");
    }
  };

  /* ================= LIVE ================= */
  const fetchLive = useCallback(async () => {
    try {
      const res = await getLiveEmployeesStatusAPI(liveDate);
      setLive(res.data.data || []);
    } catch {
      toast.error("Failed to load live status");
    }
  }, [liveDate]);

  useEffect(() => {
    if (!open.live) return;

    fetchLive();

    liveFetchRef.current = setInterval(fetchLive, 60000);
    liveTickRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        setLive((prev) =>
          prev.map((e) => {
            if (e.status === "WORKING") {
              return { ...e, workedSeconds: e.workedSeconds + 1 };
            }
            if (e.status === "ON_BREAK") {
              return { ...e, breakSeconds: e.breakSeconds + 1 };
            }
            return e;
          }),
        );
      }
    }, 1000);

    return () => {
      clearInterval(liveFetchRef.current);
      clearInterval(liveTickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open.live, liveDate]);

  /* ================= RANGE ================= */
  const fetchRange = async (silent = false) => {
    if (!fromDate || !toDate) {
      if (!silent) toast.error("Select both dates");
      return;
    }
    if (rangeLoading) return;
    try {
      if (!silent) setRangeLoading(true);
      const res = await getAllEmployeesAttendanceByDateRangeAPI(
        fromDate,
        toDate,
      );
      setRange(res.data?.data || []);
    } catch (err) {
      if (!silent) toast.error(err?.response?.data?.message || err?.message || "Failed to load summary");
    } finally {
      if (!silent) setRangeLoading(false);
    }
  };

  /* ================= WEEKLY PROGRESS ================= */
  const fetchWeekly = async (silent = false) => {
    if (!weeklyFrom) {
      if (!silent) toast.error("Select a week");
      return;
    }
    if (weeklyLoading) return;

    try {
      if (!silent) setWeeklyLoading(true);
      const res = await getAllUsersWeeklyProgressAPI(weeklyFrom);
      setWeekly(res.data?.data || []);
    } catch {
      if (!silent) toast.error("Failed to load weekly progress");
    } finally {
      if (!silent) setWeeklyLoading(false);
    }
  };

  /* ================= AUTO-REFRESH ON TAB WAKE UP ================= */
  useEffect(() => {
    let lastWake = 0;
    const handleWakeUp = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        if (now - lastWake > 2500) {
          lastWake = now;
          if (open.live) {
            fetchLive();
          }
          if (open.daily) {
            fetchDaily(true);
          }
          if (open.range && fromDate && toDate) {
            fetchRange(true);
          }
          if (open.weekly && weeklyFrom) {
            fetchWeekly(true);
          }
        }
      }
    };

    window.addEventListener("focus", handleWakeUp);
    document.addEventListener("visibilitychange", handleWakeUp);

    return () => {
      window.removeEventListener("focus", handleWakeUp);
      document.removeEventListener("visibilitychange", handleWakeUp);
    };
  }, [open.live, open.daily, open.range, open.weekly, fetchLive, fetchDaily, fromDate, toDate, weeklyFrom]);

  const employees = useMemo(() => {
    return Array.from(
      new Map(
        range.map((a) => [a.userId, { id: a.userId, name: a.name }]),
      ).values(),
    );
  }, [range]);

  const byDate = useMemo(() => {
    return range.reduce((acc, cur) => {
      const base = cur.punchIn || cur.date; // Prefer punch date
      const key = new Date(base).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      if (!acc[key]) acc[key] = {};

      // If duplicate exists, prefer PRESENT over LEAVE
      if (!acc[key][cur.userId]) {
        acc[key][cur.userId] = cur;
      } else {
        const prev = acc[key][cur.userId];
        if (prev.status === "LEAVE" && cur.status !== "LEAVE") {
          acc[key][cur.userId] = cur;
        }
      }

      return acc;
    }, {});
  }, [range]);

  const sortedDateEntries = useMemo(() => {
    return Object.entries(byDate).sort(([, recA], [, recB]) => {
      const sampleA = Object.values(recA)[0];
      const sampleB = Object.values(recB)[0];
      const timeA = sampleA?.date ? new Date(sampleA.date).getTime() : 0;
      const timeB = sampleB?.date ? new Date(sampleB.date).getTime() : 0;
      return timeA - timeB;
    });
  }, [byDate]);

  /* ================= DOWNLOAD ================= */
  const download = async () => {
    if (!fromDate || !toDate) return toast.error("Select both dates");
    const api = downloadAttendancePDFAPI;

    const res = await api(fromDate, toDate);
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Attendance ${fromDate} to ${toDate}.pdf`;
    a.click();
  };

  /* ================= UI ================= */
  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <h2>Attendance</h2>
        {/* ================= DAILY ================= */}
        <div className={styles.accordion}>
          <button
            className={styles.accordionHeader}
            onClick={() => toggle("daily")}
          >
            <span>
              <FaCalendarDay /> Daily Attendance
            </span>
            <IoChevronDown className={open.daily ? styles.rotate : ""} />
          </button>

          {open.daily && (
            <div className={styles.accordionBody}>
              <input
                type="date"
                value={date}
                className={styles.dateInput}
                onChange={(e) => setDate(e.target.value)}
              />

              {dailyLoading ? (
                <Loader />
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.headerRow}>Employee</th>
                        <th className={styles.headerRow}>Email</th>
                        <th className={styles.headerRow}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daily.map((e) => (
                        <tr key={e._id}>
                          <td>{e.name}</td>
                          <td className={styles.email}>{e.email}</td>
                          <td>
                            <select
                              value={e.status}
                              className={`${styles.tableSelect} ${styles[e.status?.toLowerCase()]}`}
                              onChange={(ev) =>
                                updateStatus(e._id, ev.target.value)
                              }
                            >
                              <option value="PRESENT">Present</option>
                              <option value="HALF_DAY">Half Day</option>
                              <option value="WFH">WFH</option>
                              <option value="ABSENT">Absent</option>
                              <option value="LEAVE">Leave</option>
                              <option value="HOLIDAY">Holiday</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= LIVE ================= */}
        <div className={styles.accordion}>
          <button
            className={styles.accordionHeader}
            onClick={() => toggle("live")}
          >
            <span>
              <FaUsers /> Live Workforce
            </span>
            <IoChevronDown className={open.live ? styles.rotate : ""} />
          </button>

          {open.live && (
            <div className={styles.accordionBody}>
              <input
                type="date"
                value={liveDate}
                className={styles.dateInput}
                onChange={(e) => setLiveDate(e.target.value)}
              />

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      <th className={styles.headerRow}>Employee</th>
                      <th className={styles.headerRow}>Status</th>
                      <th className={styles.headerRow}>Worked</th>
                      <th className={styles.headerRow}>Break</th>
                    </tr>
                  </thead>
                  <tbody>
                    {live.map((e) => (
                      <tr key={e.userId}>
                        <td>
                          <div className={styles.userCell}>
                            {e.profilePicture?.url ? (
                              <img
                                src={e.profilePicture.url}
                                alt={e.name}
                                className={styles.avatar}
                              />
                            ) : (
                              ""
                            )}

                            <span>{e.name}</span>
                          </div>
                        </td>
                        <td
                          className={
                            styles[e.status?.toLowerCase().replace("_", "")]
                          }
                        >
                          {e.status === "NOT_STARTED"
                            ? "Not Started"
                            : e.status === "WORKING"
                              ? "Working"
                              : e.status === "ON_BREAK"
                                ? "On Break"
                                : "Completed"}
                        </td>
                        <td>{formatDuration(e.workedSeconds)}</td>
                        <td>{formatDuration(e.breakSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ================= RANGE ================= */}
        <div className={styles.accordion}>
          <button
            className={styles.accordionHeader}
            onClick={() => toggle("range")}
          >
            <span>
              <FaCalendarAlt /> Attendance Summary
            </span>
            <IoChevronDown className={open.range ? styles.rotate : ""} />
          </button>

          {open.range && (
            <div className={styles.accordionBody}>
              <div className={styles.rangeFilters}>
                <input
                  type="date"
                  value={fromDate}
                  max={today}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  max={today}
                  onChange={(e) => setToDate(e.target.value)}
                />

                <button onClick={fetchRange} className={styles.primaryBtn}>
                  Get
                </button>
                <button
                  onClick={() => download(true)}
                  className={styles.primaryBtn}
                >
                  Download
                </button>
              </div>

              {rangeLoading ? (
                <Loader />
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.headerRow}>Date</th>
                        {employees.map((e) => (
                          <th key={e.id} className={styles.headerRow}>
                            {e.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDateEntries.map(([d, rec]) => (
                        <tr key={d}>
                          <td style={{ fontWeight: 700 }}>{d}</td>
                          {employees.map((e) => {
                            const item = rec[e.id];
                            if (!item) {
                              return (
                                <td key={e.id} className={styles.summaryCell}>
                                  <span className={styles.emptyDash}>—</span>
                                </td>
                              );
                            }

                            const status = item.status;
                            const punches =
                              item.punches && item.punches.length > 0
                                ? item.punches
                                : item.punchIn
                                ? [{ in: item.punchIn, out: item.punchOut }]
                                : [];
                            const totalBreakMins = item.totalBreakMinutes || 0;
                            const netWorkMins = item.netWorkMinutes || 0;

                            const statusClass = status
                              ? styles[`status_${status.toLowerCase()}`] || styles.status_default
                              : styles.status_default;

                            return (
                              <td key={e.id} className={styles.summaryCell}>
                                <div className={styles.cellHeaderRow}>
                                  <span className={`${styles.statusPill} ${statusClass}`}>
                                    {status || "—"}
                                  </span>
                                  {netWorkMins > 0 && (
                                    <span
                                      className={styles.netWorkBadge}
                                      title={`Net Work Time: ${formatMinutes(netWorkMins)}`}
                                    >
                                      ⏱️ {formatMinutes(netWorkMins)}
                                    </span>
                                  )}
                                </div>

                                {punches.length > 0 && (
                                  <div className={styles.punchList}>
                                    {punches.map((p, idx) => (
                                      <div key={idx} className={styles.punchItem}>
                                        {punches.length > 1 && (
                                          <span className={styles.punchIdx}>#{idx + 1}</span>
                                        )}
                                        <span className={styles.punchTimes}>
                                          {formatTime(p.in)} - {p.out ? formatTime(p.out) : "Active"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {(totalBreakMins > 0 || (punches.length > 0 && status === "PRESENT")) && (
                                  <div
                                    className={totalBreakMins > 0 ? styles.breakBadge : styles.breakBadgeZero}
                                    title={
                                      item.formalBreakMinutes && item.punchGapMinutes
                                        ? `Total Break: ${formatMinutes(totalBreakMins)} (Breaks: ${formatMinutes(item.formalBreakMinutes)}, Between Sessions: ${formatMinutes(item.punchGapMinutes)})`
                                        : `Total Break Duration: ${formatMinutes(totalBreakMins)}`
                                    }
                                  >
                                    ☕ Break: {formatMinutes(totalBreakMins)}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= WEEKLY PROGRESS ================= */}
        <div className={styles.accordion}>
          <button
            className={styles.accordionHeader}
            onClick={() => toggle("weekly")}
          >
            <span>
              <FaCalendarAlt /> WEEKLY PROGRESS
            </span>
            <IoChevronDown className={open.weekly ? styles.rotate : ""} />
          </button>

          {open.weekly && (
            <div className={styles.accordionBody}>
              <div className={styles.rangeFilters}>
                <input
                  type="date"
                  value={weeklyFrom}
                  max={today}
                  onChange={(e) => setWeeklyFrom(e.target.value)}
                />

                <button onClick={fetchWeekly} className={styles.primaryBtn}>
                  Get
                </button>
              </div>

              {weeklyLoading ? (
                <Loader />
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.headerRow}>Employee</th>
                        <th className={styles.headerRow}>Week Start</th>
                        <th className={styles.headerRow}>Week End</th>
                        <th className={styles.headerRow}>Worked</th>
                        <th className={styles.headerRow}>Required</th>
                        <th className={styles.headerRow}>Progress</th>
                        <th className={styles.headerRow}>Remaining</th>
                        <th className={styles.headerRow}>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {weekly.map((w) => (
                        <tr key={w.userId}>
                          <td>{w.name}</td>

                          <td>
                            {new Date(w.weekStart).toLocaleDateString("en-IN", {
                              timeZone: "Asia/Kolkata",
                            })}
                          </td>

                          <td>
                            {new Date(w.weekEnd).toLocaleDateString("en-IN", {
                              timeZone: "Asia/Kolkata",
                            })}
                          </td>

                          <td>{Math.floor(w.totalMinutes / 60)}h</td>

                          <td>{Math.floor(w.requiredMinutes / 60)}h</td>

                          <td>{w.percentage.toFixed(1)}%</td>

                          <td>{Math.floor(w.remainingMinutes / 60)}h</td>

                          <td
                            className={
                              w.status === "COMPLETED"
                                ? styles.present
                                : styles.absent
                            }
                          >
                            {w.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
