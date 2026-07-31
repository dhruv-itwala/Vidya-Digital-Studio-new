import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  getAllEmployeesAttendanceAPI,
  getLiveEmployeesStatusAPI,
  getAllEmployeesAttendanceByDateRangeAPI,
  markAttendanceStatusAPI,
  downloadAttendancePDFAPI,
  getAllUsersWeeklyProgressAPI,
} from "../../api/attendance.api";

import { FaUsers, FaCalendarDay, FaCalendarAlt, FaChartBar, FaDownload } from "react-icons/fa";
import styles from "./Attendance.module.css";
import toast from "react-hot-toast";
import Loader from "../../components/Loader/Loader";

export default function Attendance() {
  /* ================= DATES (IST SAFE) ================= */
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const [activeTab, setActiveTab] = useState("live"); // 'live', 'daily', 'range', 'weekly'

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

  const liveFetchRef = useRef(null);
  const liveTickRef = useRef(null);

  const [weeklyFrom, setWeeklyFrom] = useState("");
  const [weekly, setWeekly] = useState([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  /* ================= HELPERS ================= */

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });

  const formatDuration = (s = 0) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}h ${String(
      Math.floor((s % 3600) / 60),
    ).padStart(2, "0")}m`;

  /* ================= DAILY ================= */
  const fetchDaily = useCallback(async () => {
    try {
      setDailyLoading(true);
      const res = await getAllEmployeesAttendanceAPI(date);
      setDaily(res.data?.data || []);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setDailyLoading(false);
    }
  }, [date]);

  useEffect(() => {
    if (activeTab === "daily") fetchDaily();
  }, [date, activeTab, fetchDaily]);

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
    if (activeTab !== "live") return;

    fetchLive();

    liveFetchRef.current = setInterval(fetchLive, 60000);
    liveTickRef.current = setInterval(() => {
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
    }, 1000);

    return () => {
      clearInterval(liveFetchRef.current);
      clearInterval(liveTickRef.current);
    };
  }, [activeTab, liveDate, fetchLive]);

  /* ================= RANGE ================= */
  const fetchRange = async () => {
    if (!fromDate || !toDate) return toast.error("Select both dates");
    try {
      setRangeLoading(true);
      const res = await getAllEmployeesAttendanceByDateRangeAPI(
        fromDate,
        toDate,
      );
      setRange(res.data?.data || []);
    } finally {
      setRangeLoading(false);
    }
  };

  /* ================= WEEKLY PROGRESS ================= */
  const fetchWeekly = async () => {
    if (!weeklyFrom) return toast.error("Select a week");

    try {
      setWeeklyLoading(true);
      const res = await getAllUsersWeeklyProgressAPI(weeklyFrom);
      setWeekly(res.data?.data || []);
    } catch {
      toast.error("Failed to load weekly progress");
    } finally {
      setWeeklyLoading(false);
    }
  };

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
    <div className={styles.pageContainer}>
      
      {/* HEADER SECTION */}
      <div className={styles.headerArea}>
        <div className={styles.titleBlock}>
          <h2 className={styles.pageTitle}>Attendance Dashboard</h2>
          <p className={styles.subHeading}>Monitor live workforce status, daily attendance, and reports.</p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'live' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('live')}
        >
          <FaUsers /> Live Workforce
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'daily' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          <FaCalendarDay /> Daily Attendance
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'range' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('range')}
        >
          <FaCalendarAlt /> Summary Report
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'weekly' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          <FaChartBar /> Weekly Progress
        </button>
      </div>

      {/* ================= TAB CONTENTS ================= */}

      {/* 1. LIVE WORKFORCE */}
      {activeTab === 'live' && (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}><FaUsers /> Live Status</h3>
            <div className={styles.controlsRow}>
              <input
                type="date"
                value={liveDate}
                className={styles.dateInput}
                onChange={(e) => setLiveDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Worked</th>
                  <th>Break</th>
                </tr>
              </thead>
              <tbody>
                {live.length === 0 ? (
                  <tr><td colSpan="4"><div className={styles.emptyState}>No live workforce data available for this date.</div></td></tr>
                ) : (
                  live.map((e) => (
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
                            <div className={styles.avatar} style={{background: '#f1f5f9'}} />
                          )}
                          <span className={styles.userName}>{e.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles['status_' + e.status?.toLowerCase().replace("_", "")]}`}>
                          {e.status === "NOT_STARTED" ? "Not Started"
                            : e.status === "WORKING" ? "Working"
                            : e.status === "ON_BREAK" ? "On Break"
                            : "Completed"}
                        </span>
                      </td>
                      <td style={{fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 600}}>{formatDuration(e.workedSeconds)}</td>
                      <td style={{fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 600, color: '#64748b'}}>{formatDuration(e.breakSeconds)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* 2. DAILY ATTENDANCE */}
      {activeTab === 'daily' && (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}><FaCalendarDay /> Daily Register</h3>
            <div className={styles.controlsRow}>
              <input
                type="date"
                value={date}
                className={styles.dateInput}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {dailyLoading ? (
            <Loader />
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Email Address</th>
                    <th>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.length === 0 ? (
                    <tr><td colSpan="3"><div className={styles.emptyState}>No attendance data available for this date.</div></td></tr>
                  ) : (
                    daily.map((e) => (
                      <tr key={e._id}>
                        <td>
                          <span className={styles.userName}>{e.name}</span>
                        </td>
                        <td>
                          <span className={styles.userEmail}>{e.email}</span>
                        </td>
                        <td>
                          <select
                            value={e.status}
                            className={`${styles.tableSelect} ${styles['select_' + e.status?.toLowerCase()] || styles.select_default}`}
                            onChange={(ev) => updateStatus(e._id, ev.target.value)}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* 3. RANGE SUMMARY */}
      {activeTab === 'range' && (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}><FaCalendarAlt /> Attendance Summary</h3>
            <div className={styles.controlsRow}>
              <input
                type="date"
                value={fromDate}
                max={today}
                onChange={(e) => setFromDate(e.target.value)}
                className={styles.dateInput}
              />
              <span style={{color: 'var(--color-text-muted)', fontWeight: 600}}>TO</span>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={today}
                onChange={(e) => setToDate(e.target.value)}
                className={styles.dateInput}
              />
              <button onClick={fetchRange} className={styles.primaryBtn}>
                Generate Report
              </button>
              <button onClick={() => download(true)} className={styles.secondaryBtn}>
                <FaDownload /> Download PDF
              </button>
            </div>
          </div>

          {rangeLoading ? (
            <Loader />
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    {employees.map((e) => (
                      <th key={e.id}>{e.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(byDate).length === 0 ? (
                     <tr><td colSpan={employees.length + 1}><div className={styles.emptyState}>No report data. Select dates and generate.</div></td></tr>
                  ) : (
                    Object.entries(byDate).map(([d, rec]) => (
                      <tr key={d}>
                        <td style={{fontWeight: 700, color: 'var(--color-text)'}}>{d}</td>
                        {employees.map((e) => (
                          <td key={e.id}>
                            <span style={{
                              fontWeight: 700, 
                              color: rec[e.id]?.status === 'PRESENT' ? '#16a34a' 
                                   : rec[e.id]?.status === 'ABSENT' ? '#dc2626'
                                   : rec[e.id]?.status === 'LEAVE' ? '#ea580c'
                                   : '#475569'
                            }}>
                              {rec[e.id]?.status || "—"}
                            </span>
                            <br />
                            <small style={{color: 'var(--color-text-muted)'}}>
                              {rec[e.id]?.punchIn ? formatTime(rec[e.id].punchIn) : "--"} 
                              {" - "}
                              {rec[e.id]?.punchOut ? formatTime(rec[e.id].punchOut) : "--"}
                            </small>
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* 4. WEEKLY PROGRESS */}
      {activeTab === 'weekly' && (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}><FaChartBar /> Weekly Progress Report</h3>
            <div className={styles.controlsRow}>
              <input
                type="date"
                value={weeklyFrom}
                max={today}
                onChange={(e) => setWeeklyFrom(e.target.value)}
                className={styles.dateInput}
              />
              <button onClick={fetchWeekly} className={styles.primaryBtn}>
                Get Progress
              </button>
            </div>
          </div>

          {weeklyLoading ? (
            <Loader />
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Timeline</th>
                    <th>Hours Worked</th>
                    <th>Hours Required</th>
                    <th>Weekly Goal Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {weekly.length === 0 ? (
                     <tr><td colSpan="6"><div className={styles.emptyState}>No weekly progress available. Select a week date.</div></td></tr>
                  ) : (
                    weekly.map((w) => (
                      <tr key={w.userId}>
                        <td>
                          <span className={styles.userName}>{w.name}</span>
                        </td>
                        <td>
                          <span style={{fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>
                            {new Date(w.weekStart).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })} 
                            {" - "} 
                            {new Date(w.weekEnd).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                          </span>
                        </td>
                        <td style={{fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 600}}>
                          {Math.floor(w.totalMinutes / 60)}h
                        </td>
                        <td style={{fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 600, color: '#64748b'}}>
                          {Math.floor(w.requiredMinutes / 60)}h
                        </td>
                        <td>
                          <div className={styles.progressContainer}>
                            <div className={styles.progressBarTrack}>
                              <div 
                                className={styles.progressBarFill} 
                                style={{
                                  width: `${Math.min(w.percentage, 100)}%`,
                                  background: w.percentage >= 100 ? '#16a34a' : 'var(--deep-forest)'
                                }} 
                              />
                            </div>
                            <span className={styles.progressText}>{w.percentage.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${w.status === "COMPLETED" ? styles.status_working : styles.status_notstarted}`}>
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
