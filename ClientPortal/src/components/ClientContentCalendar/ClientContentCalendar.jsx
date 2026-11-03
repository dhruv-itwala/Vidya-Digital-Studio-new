import React, { useState, useEffect, useMemo } from "react";
import {
  FiCalendar,
  FiList,
  FiRefreshCw,
  FiExternalLink,
  FiSearch,
  FiClock,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiTrendingUp,
} from "react-icons/fi";
import {
  FaInstagram,
} from "react-icons/fa";
import toast from "react-hot-toast";
import styles from "./ClientContentCalendar.module.css";
import {
  getClientCalendarStatusAPI,
  getClientCalendarTabsAPI,
  getClientCalendarEntriesAPI,
  refreshClientCalendarAPI,
} from "../../api/clientCalendar.api";

export const CONTENT_TYPES = [
  "Instagram Post",
  "Instagram Story",
  "Instagram Reels",
  "Instagram Carousal",
  "Testimonial Post",
  "Influencer Reel",
];

export const WORK_STATUSES = ["Pending", "In Progress", "Done", "Delayed"];

export const UPLOAD_STATUSES = ["Pending", "Uploaded", "Scheduled"];

/**
 * Converts any date format (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Excel serial, ISO) into YYYY-MM-DD.
 */
export const parseDateToYMD = (val) => {
  if (!val && val !== 0) return "";
  const str = String(val).trim();
  if (!str) return "";

  // 1. Check if numeric Excel serial (e.g. 45488)
  if (/^\d{5}$/.test(str)) {
    const num = Number(str);
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) {
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    }
  }

  // 2. YYYY-MM-DD or YYYY/MM/DD
  let m = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    return `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
  }

  // 3. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  m = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (m) {
    return `${m[3]}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
  }

  // 4. DD/MM/YY
  m = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (m) {
    const yr = 2000 + parseInt(m[3], 10);
    return `${yr}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
  }

  // 5. Fallback Date parse
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  return "";
};

/**
 * Calculates day of the week from date string.
 */
export const deriveDayOfWeek = (dateStr) => {
  if (!dateStr && dateStr !== 0) return "";
  const ymd = parseDateToYMD(dateStr);
  if (!ymd) return "";
  const [year, month, day] = ymd.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long" });
};

/**
 * Formats any date into DD/MM/YYYY.
 */
export const formatDateDDMMYYYY = (val) => {
  if (!val && val !== 0) return "";
  const ymd = parseDateToYMD(val);
  if (ymd) {
    const [y, m, d] = ymd.split("-");
    return `${d}/${m}/${y}`;
  }
  return String(val);
};

/**
 * Converts DD/MM/YYYY or date string into YYYY-MM-DD.
 */
export const toInputDateValue = (val) => parseDateToYMD(val);

/**
 * Finds the tab matching the existing/current month, or the closest month tab.
 */
export const findExistingOrBestMonthTab = (tabList, referenceDate = new Date()) => {
  if (!tabList || tabList.length === 0) return "";
  const currentMonthIdx = referenceDate.getMonth();
  const currentYear = referenceDate.getFullYear();

  // 1. Exact match for existing/current month and year
  const currentMonthTab = tabList.find(
    (t) => t.isMonthTab && t.monthIndex === currentMonthIdx && t.year === currentYear
  );
  if (currentMonthTab) return currentMonthTab.title;

  // 2. Match current month name regardless of year
  const monthNameOnlyTab = tabList.find(
    (t) => t.isMonthTab && t.monthIndex === currentMonthIdx
  );
  if (monthNameOnlyTab) return monthNameOnlyTab.title;

  // 3. Closest month tab
  const monthTabs = tabList.filter((t) => t.isMonthTab && t.sortWeight !== null);
  if (monthTabs.length > 0) {
    const currentWeight = currentYear * 12 + currentMonthIdx;
    let closestTab = monthTabs[0];
    let minDiff = Math.abs(closestTab.sortWeight - currentWeight);

    for (let i = 1; i < monthTabs.length; i++) {
      const diff = Math.abs(monthTabs[i].sortWeight - currentWeight);
      if (diff < minDiff) {
        minDiff = diff;
        closestTab = monthTabs[i];
      }
    }
    return closestTab.title;
  }

  return tabList[0]?.title || "";
};

export default function ClientContentCalendar() {
  const [status, setStatus] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [selectedTab, setSelectedTab] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  // View mode: 'table' | 'calendar'
  const [viewMode, setViewMode] = useState("table");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");
  const [workStatusFilter, setWorkStatusFilter] = useState("all");
  const [uploadStatusFilter, setUploadStatusFilter] = useState("all");

  // Read-only modal
  const [activeEntry, setActiveEntry] = useState(null);

  // Month navigation for Calendar Grid
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await getClientCalendarStatusAPI();
      const statusData = res.data.data;
      setStatus(statusData);

      if (statusData.isConnected) {
        await loadTabs();
      }
    } catch (err) {
      console.error("Failed to load calendar status", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to sync calendarDate to the active tab's month/year
  const syncCalendarToTab = (tabName, tabList = tabs, entryList = entries) => {
    if (!tabName) return;
    const tabObj = tabList?.find((t) => t.title === tabName);
    if (tabObj?.isMonthTab && tabObj.monthIndex !== null && tabObj.year) {
      setCalendarDate(new Date(tabObj.year, tabObj.monthIndex, 1));
      return;
    }
    const clean = tabName.toLowerCase();
    const months = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];
    const abbrs = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    let mIdx = months.findIndex((m) => clean.includes(m));
    if (mIdx === -1) mIdx = abbrs.findIndex((a) => clean.includes(a));
    const yrMatch = clean.match(/\b(20\d\d)\b/);
    const yr = yrMatch ? parseInt(yrMatch[1], 10) : new Date().getFullYear();
    if (mIdx !== -1) {
      setCalendarDate(new Date(yr, mIdx, 1));
      return;
    }
    const firstDateEntry = entryList?.find((e) => e.date);
    if (firstDateEntry) {
      const ymd = parseDateToYMD(firstDateEntry.date);
      if (ymd) {
        const [y, m] = ymd.split("-").map(Number);
        setCalendarDate(new Date(y, m - 1, 1));
      }
    }
  };

  const loadTabs = async (refresh = false) => {
    try {
      const res = await getClientCalendarTabsAPI(refresh);
      const tabList = res.data.data.tabs || [];

      // Sort tabs reverse chronologically (latest/newest month first: Nov 2026, Oct 2026, Sep 2026...)
      const sortedTabs = [...tabList].sort((a, b) => {
        if (a.isMonthTab && b.isMonthTab) {
          return (b.sortWeight || 0) - (a.sortWeight || 0);
        }
        if (a.isMonthTab && !b.isMonthTab) return -1;
        if (!a.isMonthTab && b.isMonthTab) return 1;
        return (a.index || 0) - (b.index || 0);
      });
      setTabs(sortedTabs);

      const activeTab =
        selectedTab && sortedTabs.some((t) => t.title === selectedTab)
          ? selectedTab
          : findExistingOrBestMonthTab(sortedTabs);

      setSelectedTab(activeTab);
      syncCalendarToTab(activeTab, sortedTabs);
      if (activeTab) {
        await loadEntries(activeTab, refresh, sortedTabs);
      }
    } catch (err) {
      console.error("Failed to load tabs", err);
    }
  };

  const loadEntries = async (tabName, refresh = false, tabList = tabs) => {
    if (!tabName) return;
    try {
      setLoading(true);
      const res = await getClientCalendarEntriesAPI({
        tab: tabName,
        refresh: refresh ? "true" : "false",
      });
      const newEntries = res.data.data.entries || [];
      setEntries(newEntries);
      setLastSynced(new Date());
      syncCalendarToTab(tabName, tabList, newEntries);
    } catch (err) {
      toast.error(err.message || "Failed to load content entries");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabName) => {
    setSelectedTab(tabName);
    syncCalendarToTab(tabName, tabs);
    loadEntries(tabName, false, tabs);
  };

  const handleRefresh = async () => {
    if (!selectedTab) return;
    try {
      setRefreshing(true);
      const res = await refreshClientCalendarAPI(selectedTab);
      setEntries(res.data.data.entries || []);
      if (res.data.data.tabs) {
        const sortedTabs = [...res.data.data.tabs].sort((a, b) => {
          if (a.isMonthTab && b.isMonthTab) {
            return (b.sortWeight || 0) - (a.sortWeight || 0);
          }
          if (a.isMonthTab && !b.isMonthTab) return -1;
          if (!a.isMonthTab && b.isMonthTab) return 1;
          return (a.index || 0) - (b.index || 0);
        });
        setTabs(sortedTabs);
      }
      setLastSynced(new Date());
      toast.success("Calendar updated from Google Sheets");
    } catch (err) {
      toast.error(err.message || "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  const getWorkStatusBadge = (postStatus) => {
    if (!postStatus || !postStatus.trim()) {
      return <span style={{ color: "#9ca3af" }}>-</span>;
    }
    const s = postStatus.toLowerCase().trim();
    if (s.includes("prog") || s.includes("work") || s.includes("wip")) {
      return <span className={`${styles.badgeStatus} ${styles.badgeInProgress}`}>In Progress</span>;
    }
    if (s.includes("done") || s.includes("comp") || s.includes("finish")) {
      return <span className={`${styles.badgeStatus} ${styles.badgeDone}`}>Done</span>;
    }
    if (s.includes("delay") || s.includes("hold") || s.includes("late")) {
      return <span className={`${styles.badgeStatus} ${styles.badgeDelayed}`}>Delayed</span>;
    }
    return <span className={`${styles.badgeStatus} ${styles.badgePending}`}>{postStatus}</span>;
  };

  const getUploadStatusBadge = (postStatus) => {
    if (!postStatus || !postStatus.trim()) {
      return <span style={{ color: "#9ca3af" }}>-</span>;
    }
    const s = postStatus.toLowerCase().trim();
    if (s.includes("upload") || s.includes("pub") || s.includes("live")) {
      return <span className={`${styles.badgeStatus} ${styles.badgeUploaded}`}>Uploaded</span>;
    }
    if (s.includes("sched") || s.includes("queue")) {
      return <span className={`${styles.badgeStatus} ${styles.badgeUploadScheduled}`}>Scheduled</span>;
    }
    return <span className={`${styles.badgeStatus} ${styles.badgeUploadPending}`}>{postStatus}</span>;
  };

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Content Type filter
      if (
        contentTypeFilter !== "all" &&
        entry.contentType?.toLowerCase() !== contentTypeFilter.toLowerCase() &&
        entry.platform?.toLowerCase() !== contentTypeFilter.toLowerCase()
      ) {
        return false;
      }
      // Work Status filter
      if (
        workStatusFilter !== "all" &&
        entry.workStatus?.toLowerCase() !== workStatusFilter.toLowerCase() &&
        entry.status?.toLowerCase() !== workStatusFilter.toLowerCase()
      ) {
        return false;
      }
      // Upload Status filter
      if (
        uploadStatusFilter !== "all" &&
        entry.uploadStatus?.toLowerCase() !== uploadStatusFilter.toLowerCase()
      ) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDetails =
          (entry.contentDetails || entry.title || entry.caption || "")
            .toLowerCase()
            .includes(q);
        const matchType = (entry.contentType || "").toLowerCase().includes(q);
        const matchDate = (entry.date || "").toLowerCase().includes(q);
        const matchDay = (entry.day || "").toLowerCase().includes(q);
        if (!matchDetails && !matchType && !matchDate && !matchDay) return false;
      }
      return true;
    });
  }, [entries, contentTypeFilter, workStatusFilter, uploadStatusFilter, searchQuery]);

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month filler days (proper Date math)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthDays - i);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, "0");
      const d = String(prevDate.getDate()).padStart(2, "0");
      days.push({
        dateNumber: prevMonthDays - i,
        isCurrentMonth: false,
        fullDateStr: `${y}-${m}-${d}`,
      });
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const isToday =
        today.getFullYear() === year && today.getMonth() === month && today.getDate() === i;

      days.push({
        dateNumber: i,
        isCurrentMonth: true,
        fullDateStr: dateStr,
        isToday,
      });
    }

    // Next month filler days (proper Date math)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, "0");
      const d = String(nextDate.getDate()).padStart(2, "0");
      days.push({
        dateNumber: i,
        isCurrentMonth: false,
        fullDateStr: `${y}-${m}-${d}`,
      });
    }

    return days;
  }, [calendarDate]);

  const entriesByDate = useMemo(() => {
    const map = {};
    filteredEntries.forEach((entry) => {
      if (!entry.date) return;
      const cleanDate = parseDateToYMD(entry.date);
      if (!cleanDate) return;
      if (!map[cleanDate]) map[cleanDate] = [];
      map[cleanDate].push(entry);
    });
    return map;
  }, [filteredEntries]);

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  return (
    <div className={styles.calendarContainer}>
      {/* 1. Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <FiCalendar className={styles.calendarIcon} />
          <div>
            <h2 className={styles.heading}>Content Calendar</h2>
            <p className={styles.subHeading}>
              {status?.sheetTitle ? (
                <>Schedule synced with <strong>{status.sheetTitle}</strong></>
              ) : (
                "View scheduled social media posts and publishing schedule."
              )}
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          {lastSynced && (
            <span className={styles.lastUpdated}>
              Updated: {lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {status?.isConnected && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className={styles.refreshBtn}
            >
              <FiRefreshCw className={refreshing ? styles.spinning : ""} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Monthly Tabs */}
      {status?.isConnected && tabs.length > 0 && (
        <div className={styles.tabsContainer}>
          {tabs.map((tab) => (
            <button
              key={tab.title}
              type="button"
              onClick={() => handleTabChange(tab.title)}
              className={`${styles.tabBtn} ${selectedTab === tab.title ? styles.tabBtnActive : ""}`}
            >
              <FiCalendar />
              <span>{tab.title}</span>
              {selectedTab === tab.title && filteredEntries.length > 0 && (
                <span style={{ fontSize: "0.75rem", background: "#e0e7ff", color: "#3730a3", padding: "0.1rem 0.45rem", borderRadius: "999px", fontWeight: 600 }}>
                  {filteredEntries.length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 3. Controls & Filter Bar */}
      {status?.isConnected && selectedTab && (
        <div className={styles.controlsBar}>
          <div className={styles.filterGroup}>
            <div className={styles.searchInput}>
              <FiSearch style={{ color: "#9ca3af" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search details, dates..."
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer" }}
                >
                  <FiX />
                </button>
              )}
            </div>

            {/* Content Type Filter */}
            <select
              value={contentTypeFilter}
              onChange={(e) => setContentTypeFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="all">All Content Types</option>
              {CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Work Status Filter */}
            <select
              value={workStatusFilter}
              onChange={(e) => setWorkStatusFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="all">All Work Statuses</option>
              {WORK_STATUSES.map((ws) => (
                <option key={ws} value={ws}>
                  Work: {ws}
                </option>
              ))}
            </select>

            {/* Upload Status Filter */}
            <select
              value={uploadStatusFilter}
              onChange={(e) => setUploadStatusFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="all">All Upload Statuses</option>
              {UPLOAD_STATUSES.map((us) => (
                <option key={us} value={us}>
                  Upload: {us}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.viewSwitchers}>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`${styles.viewBtn} ${viewMode === "table" ? styles.viewBtnActive : ""}`}
            >
              <FiList /> Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`${styles.viewBtn} ${viewMode === "calendar" ? styles.viewBtnActive : ""}`}
            >
              <FiCalendar /> Calendar
            </button>
          </div>
        </div>
      )}

      {/* 4. Content Area */}
      {loading && !refreshing ? (
        <div className={styles.emptyState}>
          <div className={`${styles.emptyStateIcon} ${styles.spinning}`}>
            <FiRefreshCw />
          </div>
          <p>Loading your content calendar...</p>
        </div>
      ) : !status?.isConnected ? (
        <div className={styles.emptyState}>
          <FiAlertCircle className={styles.emptyStateIcon} />
          <p>Your content calendar spreadsheet has not been connected yet.</p>
          <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            Please contact your account manager to activate your live calendar.
          </span>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className={styles.emptyState}>
          <FiCalendar className={styles.emptyStateIcon} />
          <p>No content scheduled in <strong>"{selectedTab}"</strong> yet.</p>
        </div>
      ) : (
        <>
          {/* VIEW 1: TABLE VIEW */}
          {viewMode === "table" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Content Type</th>
                    <th>Content Details</th>
                    <th>Ad Run</th>
                    <th>Data Link</th>
                    <th>Work Status</th>
                    <th>Upload Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((post) => (
                    <tr
                      key={post.id}
                      onClick={() => setActiveEntry(post)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ whiteSpace: "nowrap", fontWeight: 600, color: "#2563eb" }}>
                        {formatDateDDMMYYYY(post.date) || "-"}
                      </td>
                      <td style={{ whiteSpace: "nowrap", color: "#6b7280" }}>
                        {post.day || deriveDayOfWeek(post.date) || "-"}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {post.contentType && post.contentType.trim() ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                            <FaInstagram style={{ color: "#e1306c" }} />
                            <strong>{post.contentType}</strong>
                          </span>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>-</span>
                        )}
                      </td>
                      <td style={{ maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {post.contentDetails || post.title || post.caption || "-"}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {post.adRun ? (
                          <span style={{ color: "#059669", fontWeight: 500 }}>
                            {formatDateDDMMYYYY(post.adRun)}
                          </span>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>-</span>
                        )}
                      </td>
                      <td>
                        {post.dataLink || post.creativeUrl ? (
                          <a
                            href={post.dataLink || post.creativeUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={styles.btnSecondary}
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                            title="Open Data Link"
                          >
                            <FiExternalLink /> Link
                          </a>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>-</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {getWorkStatusBadge(post.workStatus || post.status)}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {getUploadStatusBadge(post.uploadStatus)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveEntry(post);
                          }}
                        >
                          <FiEye /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 2: CALENDAR GRID (Shows ONLY Content Type per user request) */}
          {viewMode === "calendar" && (
            <div className={styles.calendarGridContainer}>
              <div className={styles.calendarNav}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className={styles.btnNav}
                  title="Previous Month"
                >
                  <FiChevronLeft />
                </button>
                <div className={styles.calendarNavTitle} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span>{calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                  <span style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 500, background: "#ecfdf5", padding: "0.15rem 0.6rem", borderRadius: "100px" }}>
                    {Object.keys(entriesByDate).reduce((acc, dStr) => {
                      const [y, m] = dStr.split("-").map(Number);
                      if (y === calendarDate.getFullYear() && m === calendarDate.getMonth() + 1) {
                        return acc + (entriesByDate[dStr]?.filter(p => p.contentType?.trim())?.length || 0);
                      }
                      return acc;
                    }, 0)} scheduled
                  </span>
                  <button
                    type="button"
                    onClick={() => syncCalendarToTab(selectedTab, tabs, entries)}
                    className={styles.btnSecondary}
                    style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                    title="Jump to active tab's month"
                  >
                    Sync to Tab
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className={styles.btnNav}
                  title="Next Month"
                >
                  <FiChevronRight />
                </button>
              </div>

              <div className={styles.daysOfWeek}>
                <div>SUN</div>
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
              </div>

              <div className={styles.monthGrid}>
                {calendarDays.map((day, idx) => {
                  const dayEntries = entriesByDate[day.fullDateStr] || [];
                  const scheduledEntries = dayEntries.filter(
                    (post) => post.contentType && post.contentType.trim()
                  );

                  return (
                    <div
                      key={idx}
                      className={`${styles.dayCell} ${!day.isCurrentMonth ? styles.dayCellOtherMonth : ""} ${day.isToday ? styles.todayHighlight : ""}`}
                    >
                      <div className={styles.dayHeader}>
                        <span className={styles.dayNumber}>{day.dateNumber}</span>
                      </div>

                      <div className={styles.dayPostsList}>
                        {scheduledEntries.map((post) => (
                          <div
                            key={post.id}
                            className={styles.postPill}
                            onClick={() => setActiveEntry(post)}
                            title={`${post.contentType}${post.contentDetails ? `:\n${post.contentDetails}` : ""}`}
                          >
                            <FaInstagram style={{ color: "#e1306c", flexShrink: 0 }} />
                            <span>{post.contentType}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* 5. READ-ONLY DETAIL MODAL FOR CLIENT */}
      {activeEntry && (
        <div className={styles.modalOverlay} onClick={() => setActiveEntry(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.detailLabel}>Content Details</span>
                <h3>{activeEntry.contentType || "Scheduled Content"}</h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setActiveEntry(null)}
              >
                <FiX />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                {activeEntry.contentType && (
                  <div className={styles.platformPill}>
                    <FaInstagram style={{ color: "#e1306c" }} />
                    <span>{activeEntry.contentType}</span>
                  </div>
                )}
                {getWorkStatusBadge(activeEntry.workStatus || activeEntry.status)}
                {getUploadStatusBadge(activeEntry.uploadStatus)}
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Publishing Date</span>
                <span className={styles.detailValue}>
                  <FiClock style={{ marginRight: "0.4rem" }} />
                  {formatDateDDMMYYYY(activeEntry.date)} ({activeEntry.day || deriveDayOfWeek(activeEntry.date)})
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Content Description & Script</span>
                <div className={styles.captionBox}>
                  {activeEntry.contentDetails || activeEntry.title || activeEntry.caption || "No details provided"}
                </div>
              </div>

              {activeEntry.adRun && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Ad Run Date</span>
                  <span style={{ color: "#059669", fontWeight: 600 }}>
                    {formatDateDDMMYYYY(activeEntry.adRun)}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                {(activeEntry.dataLink || activeEntry.creativeUrl) && (
                  <a
                    href={activeEntry.dataLink || activeEntry.creativeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.btnPrimary}
                  >
                    <FiExternalLink /> Open Creative Data Link
                  </a>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setActiveEntry(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
