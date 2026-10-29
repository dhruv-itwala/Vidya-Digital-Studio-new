import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  getAllEmployeesAttendanceAPI,
  getLiveEmployeesStatusAPI,
  getAllEmployeesAttendanceByDateRangeAPI,
  markAttendanceStatusAPI,
  downloadAttendancePDFAPI,
  getAllUsersWeeklyProgressAPI,
} from "../../api/attendance.api";
import { getAllUsersAPI } from "../../api/admin.api";

import { FaUsers, FaCalendarDay, FaCalendarAlt, FaChartBar, FaDownload, FaFilter, FaSearch } from "react-icons/fa";
import styles from "./Attendance.module.css";
import toast from "react-hot-toast";
import Loader from "../../components/Loader/Loader";
import InlineLoader from "../UI/InlineLoader";
import { useQuery } from "../../hooks/useQuery";
import { getBackendErrorMessage } from "../../utils/errorHandler";

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
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const [live, setLive] = useState([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [range, setRange] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Employee filter state for Attendance Summary
  const [allUsersList, setAllUsersList] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const empDropdownRef = useRef(null);

  const liveFetchRef = useRef(null);
  const liveTickRef = useRef(null);

  const [weeklyFrom, setWeeklyFrom] = useState("");
  const [weekly, setWeekly] = useState([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

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
    if (activeTab === "daily") fetchDaily();
  }, [date, activeTab, fetchDaily]);

  const updateStatus = async (id, status) => {
    if (updatingStatusId) return;
    try {
      setUpdatingStatusId(id);
      await markAttendanceStatusAPI({ userId: id, date, status });
      setDaily((p) => p.map((e) => (e._id === id ? { ...e, status } : e)));
      toast.success("Updated");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Update failed");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  /* ================= LIVE (TANSTACK QUERY POLLING) ================= */
  const { data: liveData, refetch: refetchLive } = useQuery({
    queryKey: ["attendance-live", liveDate],
    queryFn: async () => {
      try {
        const res = await getLiveEmployeesStatusAPI(liveDate);
        return res.data?.data || [];
      } catch (err) {
        toast.error(getBackendErrorMessage(err, "Failed to load live status"));
        return [];
      }
    },
    enabled: activeTab === "live",
    staleTime: 15000,
    refetchInterval: 30000, // 30s tab-aware polling
  });

  useEffect(() => {
    if (liveData) {
      setLive(liveData);
    }
  }, [liveData]);

  // Load full employee list for the Attendance Summary filter
  useEffect(() => {
    getAllUsersAPI()
      .then((res) => {
        const users = res.data?.data || res.data || [];
        setAllUsersList(users.filter((u) => u.isActive !== false));
      })
      .catch((err) => console.error("Failed to fetch users for attendance filter", err));
  }, []);

  // Close employee filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (empDropdownRef.current && !empDropdownRef.current.contains(e.target)) {
        setEmpDropdownOpen(false);
      }
    };
    if (empDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [empDropdownOpen]);

  // Local 1-second display ticker
  useEffect(() => {
    if (activeTab !== "live") return;

    const tickInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        setLive((prev) =>
          prev.map((e) => {
            if (e.status === "WORKING") {
              return { ...e, workedSeconds: (e.workedSeconds || 0) + 1 };
            }
            if (e.status === "ON_BREAK") {
              return { ...e, breakSeconds: (e.breakSeconds || 0) + 1 };
            }
            return e;
          }),
        );
      }
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [activeTab]);

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
        selectedEmployeeIds.length > 0 ? selectedEmployeeIds : null,
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
    } catch (err) {
      if (!silent) toast.error(err?.response?.data?.message || err?.message || "Failed to load weekly progress");
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
          if (activeTab === "live") {
            refetchLive?.();
          } else if (activeTab === "daily") {
            fetchDaily(true);
          } else if (activeTab === "range" && fromDate && toDate) {
            fetchRange(true);
          } else if (activeTab === "weekly" && weeklyFrom) {
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
  }, [activeTab, fetchDaily, fromDate, toDate, weeklyFrom, refetchLive]);

  const allEmployees = useMemo(() => {
    const map = new Map();
    allUsersList.forEach((u) => {
      map.set(String(u._id), { id: String(u._id), name: u.name, role: u.role });
    });
    range.forEach((a) => {
      if (a.userId && a.name && !map.has(String(a.userId))) {
        map.set(String(a.userId), { id: String(a.userId), name: a.name, role: a.role });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsersList, range]);

  const displayedEmployees = useMemo(() => {
    const source = range.length > 0
      ? Array.from(new Map(range.map((a) => [String(a.userId), { id: String(a.userId), name: a.name, role: a.role }])).values())
      : allEmployees;

    if (!selectedEmployeeIds || selectedEmployeeIds.length === 0) {
      return source;
    }
    return source.filter((e) => selectedEmployeeIds.includes(e.id));
  }, [range, allEmployees, selectedEmployeeIds]);

  const filteredEmpOptions = useMemo(() => {
    if (!empSearch.trim()) return allEmployees;
    const q = empSearch.toLowerCase().trim();
    return allEmployees.filter(
      (e) => e.name.toLowerCase().includes(q) || (e.role && e.role.toLowerCase().includes(q))
    );
  }, [allEmployees, empSearch]);

  const toggleEmployeeSelection = (id) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

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
    if (downloading) return;
    try {
      setDownloading(true);
      const api = downloadAttendancePDFAPI;
      const res = await api(
        fromDate,
        toDate,
        selectedEmployeeIds.length > 0 ? selectedEmployeeIds : null,
      );
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Attendance ${fromDate} to ${toDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to download attendance PDF");
    } finally {
      setDownloading(false);
    }
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
                          {e.isLateHalfDay && (
                            <span
                              className={styles.lateHalfDayBadge}
                              title="Login after 10:30 AM (Strict Rule: Auto Half Day)"
                            >
                              Late (Half Day)
                            </span>
                          )}
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
                          {e.isLateHalfDay && (
                            <span
                              className={styles.lateHalfDayBadge}
                              title="Login after 10:30 AM (Strict Rule: Auto Half Day)"
                            >
                              Late (Half Day)
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={styles.userEmail}>{e.email}</span>
                        </td>
                        <td>
                          <select
                            value={e.status}
                            disabled={updatingStatusId === e._id}
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

              {/* EMPLOYEE MULTI-SELECT FILTER */}
              <div className={styles.empFilterWrapper} ref={empDropdownRef}>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${selectedEmployeeIds.length > 0 ? styles.filterBtnActive : ''}`}
                  onClick={() => setEmpDropdownOpen((prev) => !prev)}
                >
                  <FaFilter />
                  <span>
                    {selectedEmployeeIds.length === 0
                      ? "All Employees"
                      : `${selectedEmployeeIds.length} Selected`}
                  </span>
                  <span className={styles.filterCountBadge}>
                    {selectedEmployeeIds.length === 0
                      ? allEmployees.length
                      : `${selectedEmployeeIds.length}/${allEmployees.length}`}
                  </span>
                </button>

                {empDropdownOpen && (
                  <div className={styles.empDropdown}>
                    <div className={styles.empDropdownHeader}>
                      <div className={styles.empSearchBox}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                          type="text"
                          placeholder="Search employee..."
                          value={empSearch}
                          onChange={(e) => setEmpSearch(e.target.value)}
                          className={styles.empSearchInput}
                          autoFocus
                        />
                        {empSearch && (
                          <button
                            type="button"
                            className={styles.clearSearchBtn}
                            onClick={() => setEmpSearch("")}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <div className={styles.empQuickActions}>
                        <button
                          type="button"
                          className={styles.quickActionBtn}
                          onClick={() => setSelectedEmployeeIds([])}
                        >
                          Select All
                        </button>
                        {selectedEmployeeIds.length > 0 && (
                          <button
                            type="button"
                            className={styles.quickActionBtn}
                            onClick={() => setSelectedEmployeeIds([])}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={styles.empListScroll}>
                      <label className={styles.empListItem}>
                        <input
                          type="checkbox"
                          checked={selectedEmployeeIds.length === 0}
                          onChange={() => setSelectedEmployeeIds([])}
                        />
                        <span className={styles.empItemName} style={{ fontWeight: 700 }}>
                          All Employees ({allEmployees.length})
                        </span>
                      </label>

                      {filteredEmpOptions.map((emp) => {
                        const isChecked = selectedEmployeeIds.includes(emp.id);
                        return (
                          <label key={emp.id} className={styles.empListItem}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleEmployeeSelection(emp.id)}
                            />
                            <div className={styles.empItemInfo}>
                              <span className={styles.empItemName}>{emp.name}</span>
                              {emp.role && (
                                <span className={styles.empItemRole}>{emp.role}</span>
                              )}
                            </div>
                          </label>
                        );
                      })}

                      {filteredEmpOptions.length === 0 && (
                        <div className={styles.noEmpMatch}>No employees matching "{empSearch}"</div>
                      )}
                    </div>

                    <div className={styles.empDropdownFooter}>
                      <span>{selectedEmployeeIds.length === 0 ? "Showing all" : `${selectedEmployeeIds.length} employee(s) selected`}</span>
                      <button
                        type="button"
                        className={styles.applyFilterBtn}
                        onClick={() => {
                          setEmpDropdownOpen(false);
                          if (fromDate && toDate) fetchRange();
                        }}
                      >
                        Apply Filter
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={fetchRange} className={styles.primaryBtn} disabled={rangeLoading || downloading}>
                {rangeLoading && <InlineLoader size={14} />}
                <span>{rangeLoading ? "Generating..." : "Generate Report"}</span>
              </button>
              <button onClick={download} className={styles.secondaryBtn} disabled={rangeLoading || downloading}>
                {downloading ? <InlineLoader size={14} /> : <FaDownload />}
                <span>{downloading ? "Downloading..." : "Download PDF"}</span>
              </button>
            </div>

            {/* ACTIVE FILTER TAGS */}
            {selectedEmployeeIds.length > 0 && (
              <div className={styles.activeFilterBar}>
                <span className={styles.activeFilterLabel}>Filtered Employees:</span>
                <div className={styles.activeFilterTags}>
                  {selectedEmployeeIds.map((id) => {
                    const emp = allEmployees.find((e) => e.id === id);
                    if (!emp) return null;
                    return (
                      <span key={id} className={styles.empTag}>
                        {emp.name}
                        <button
                          type="button"
                          onClick={() => toggleEmployeeSelection(id)}
                          className={styles.removeTagBtn}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSelectedEmployeeIds([])}
                    className={styles.clearAllTagsBtn}
                  >
                    Clear Filter (Show All)
                  </button>
                </div>
              </div>
            )}
          </div>

          {rangeLoading ? (
            <Loader />
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    {displayedEmployees.map((e) => (
                      <th key={e.id}>{e.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(byDate).length === 0 ? (
                     <tr><td colSpan={displayedEmployees.length + 1}><div className={styles.emptyState}>No report data. Select dates and generate.</div></td></tr>
                  ) : (
                    sortedDateEntries.map(([d, rec]) => (
                      <tr key={d}>
                        <td style={{fontWeight: 700, color: 'var(--color-text)'}}>{d}</td>
                        {displayedEmployees.map((e) => {
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
              <button onClick={fetchWeekly} className={styles.primaryBtn} disabled={weeklyLoading}>
                {weeklyLoading && <InlineLoader size={14} />}
                <span>{weeklyLoading ? "Loading..." : "Get Progress"}</span>
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
