import React, { useState, useEffect, useMemo } from "react";
import {
  FiCalendar,
  FiList,
  FiPlus,
  FiRefreshCw,
  FiExternalLink,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import {
  FaInstagram,
  FaFileExcel,
} from "react-icons/fa";
import toast from "react-hot-toast";
import styles from "./ContentCalendarManager.module.css";
import {
  getCalendarStatusAPI,
  getCalendarTabsAPI,
  getCalendarEntriesAPI,
  createCalendarEntryAPI,
  updateCalendarEntryAPI,
  deleteCalendarEntryAPI,
  refreshCalendarAPI,
  connectSpreadsheetAPI,
  disconnectSpreadsheetAPI,
  createMonthTabAPI,
} from "../../../api/contentCalendar.api";

// Specification dropdown options
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
 * Supports DD/MM/YYYY, YYYY-MM-DD, or Date object.
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
 * Converts DD/MM/YYYY or date string into YYYY-MM-DD for HTML5 date inputs.
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

export default function ContentCalendarManager({
  clientId,
  readOnly = false,
  onSpreadsheetUpdated = null,
}) {
  // Connection and metadata state
  const [statusData, setStatusData] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [selectedTab, setSelectedTab] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  // View state: 'table' | 'calendar' (Card option removed per user request)
  const [viewMode, setViewMode] = useState("table");

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");
  const [workStatusFilter, setWorkStatusFilter] = useState("all");
  const [uploadStatusFilter, setUploadStatusFilter] = useState("all");

  // Connection URL state
  const [sheetUrlInput, setSheetUrlInput] = useState("");
  const [connecting, setConnecting] = useState(false);

  // Create / Edit Entry Modal
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [savingEntry, setSavingEntry] = useState(false);

  // New Month Tab Modal
  const [isNewTabModalOpen, setIsNewTabModalOpen] = useState(false);
  const [newTabMonth, setNewTabMonth] = useState("July");
  const [newTabYear, setNewTabYear] = useState("2026");
  const [creatingTab, setCreatingTab] = useState(false);

  // Form state for creating/editing an entry
  const [entryForm, setEntryForm] = useState({
    date: "", // YYYY-MM-DD for datepicker
    day: "",
    contentType: "Instagram Post",
    contentDetails: "",
    adRun: "",
    dataLink: "",
    assignedTo: "",
    workStatus: "Pending",
    uploadStatus: "Pending",
  });

  // Calendar View month navigation
  const [calendarDate, setCalendarDate] = useState(new Date());

  // 1. Initial Load: Check connection status and tabs
  useEffect(() => {
    if (clientId) {
      loadCalendarStatus();
    }
  }, [clientId]);

  const loadCalendarStatus = async () => {
    try {
      setLoading(true);
      const res = await getCalendarStatusAPI(clientId);
      const data = res.data.data;
      setStatusData(data);
      if (data.spreadsheetUrl) {
        setSheetUrlInput(data.spreadsheetUrl);
      }

      if (data.isConnected) {
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
    // Try to extract month and year from tab title (e.g. "July 2026", "Nov 2026")
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
    // Fallback: check first entry that has a date
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
      const res = await getCalendarTabsAPI(clientId, refresh);
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
      toast.error(err.message || "Failed to discover spreadsheet tabs");
    }
  };

  const loadEntries = async (tabName, refresh = false, tabList = tabs) => {
    if (!tabName) return;
    try {
      setLoading(true);
      const res = await getCalendarEntriesAPI(clientId, {
        tab: tabName,
        refresh: refresh ? "true" : "false",
      });
      const newEntries = res.data.data.entries || [];
      setEntries(newEntries);
      setLastSynced(new Date());
      syncCalendarToTab(tabName, tabList, newEntries);
    } catch (err) {
      toast.error(err.message || "Failed to load calendar entries");
    } finally {
      setLoading(false);
    }
  };

  // Switch Tab
  const handleTabChange = (tabName) => {
    setSelectedTab(tabName);
    syncCalendarToTab(tabName, tabs);
    loadEntries(tabName, false, tabs);
  };

  // Manual Refresh
  const handleRefresh = async () => {
    if (!selectedTab) return;
    try {
      setRefreshing(true);
      const res = await refreshCalendarAPI(clientId, selectedTab);
      setEntries(res.data.data.entries || []);
      if (res.data.data.tabs) {
        setTabs(res.data.data.tabs);
      }
      setLastSynced(new Date());
      toast.success("Calendar refreshed from Google Sheets");
    } catch (err) {
      toast.error(err.message || "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  // Connect Google Spreadsheet
  const handleConnectSpreadsheet = async (e) => {
    e?.preventDefault();
    if (!sheetUrlInput.trim()) {
      toast.error("Please enter a valid Google Spreadsheet URL");
      return;
    }

    try {
      setConnecting(true);
      const res = await connectSpreadsheetAPI(clientId, sheetUrlInput.trim());
      toast.success(res.data.message || "Spreadsheet connected!");
      if (onSpreadsheetUpdated) {
        onSpreadsheetUpdated(sheetUrlInput.trim());
      }
      await loadCalendarStatus();
    } catch (err) {
      toast.error(err.message || "Failed to connect Google Spreadsheet");
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect Google Spreadsheet
  const handleDisconnectSpreadsheet = async () => {
    if (!window.confirm("Disconnect Google Spreadsheet from this client?")) return;
    try {
      setConnecting(true);
      await disconnectSpreadsheetAPI(clientId);
      toast.success("Spreadsheet disconnected");
      setStatusData((prev) => ({ ...prev, isConnected: false, status: "disconnected" }));
      setTabs([]);
      setEntries([]);
      setSelectedTab("");
      if (onSpreadsheetUpdated) {
        onSpreadsheetUpdated("");
      }
    } catch (err) {
      toast.error(err.message || "Failed to disconnect spreadsheet");
    } finally {
      setConnecting(false);
    }
  };

  // Create New Month Tab (e.g. "July 2026")
  const handleCreateMonthTab = async (e) => {
    e.preventDefault();
    const formattedTabTitle = `${newTabMonth} ${newTabYear}`.trim();
    if (!formattedTabTitle) return;

    try {
      setCreatingTab(true);
      await createMonthTabAPI(clientId, formattedTabTitle);
      toast.success(`Tab '${formattedTabTitle}' created in Google Sheets`);
      setIsNewTabModalOpen(false);
      await loadTabs(true);
      handleTabChange(formattedTabTitle);
    } catch (err) {
      toast.error(err.message || "Failed to create tab in spreadsheet");
    } finally {
      setCreatingTab(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = (defaultDate = "") => {
    const rawDate = defaultDate || new Date().toISOString().split("T")[0];
    const derivedDay = deriveDayOfWeek(rawDate);

    setEditingEntry(null);
    setEntryForm({
      date: toInputDateValue(rawDate),
      day: derivedDay,
      contentType: "Instagram Post",
      contentDetails: "",
      adRun: "",
      dataLink: "",
      assignedTo: "",
      workStatus: "Pending",
      uploadStatus: "Pending",
    });
    setIsEntryModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (entry) => {
    setEditingEntry(entry);
    const dateInputVal = toInputDateValue(entry.date);
    const adRunInputVal = toInputDateValue(entry.adRun);

    setEntryForm({
      date: dateInputVal,
      day: entry.day || deriveDayOfWeek(dateInputVal),
      contentType: entry.contentType || "Instagram Post",
      contentDetails: entry.contentDetails || entry.caption || entry.title || "",
      adRun: adRunInputVal,
      dataLink: entry.dataLink || entry.creativeUrl || "",
      assignedTo: entry.assignedTo || "",
      workStatus: entry.workStatus || entry.status || "Pending",
      uploadStatus: entry.uploadStatus || "Pending",
    });
    setIsEntryModalOpen(true);
  };

  // Handle Date Change in Form -> auto calculate Day
  const handleDateChange = (val) => {
    const calculatedDay = deriveDayOfWeek(val);
    setEntryForm((prev) => ({
      ...prev,
      date: val,
      day: calculatedDay,
    }));
  };

  // Save (Create or Update) Entry
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!entryForm.date) {
      toast.error("Date is required");
      return;
    }
    if (!entryForm.contentDetails.trim()) {
      toast.error("Content details is required");
      return;
    }

    try {
      setSavingEntry(true);
      const payload = {
        tab: selectedTab,
        date: formatDateDDMMYYYY(entryForm.date),
        day: entryForm.day || deriveDayOfWeek(entryForm.date),
        contentType: entryForm.contentType,
        contentDetails: entryForm.contentDetails.trim(),
        adRun: entryForm.adRun ? formatDateDDMMYYYY(entryForm.adRun) : "",
        dataLink: entryForm.dataLink.trim(),
        assignedTo: entryForm.assignedTo,
        workStatus: entryForm.workStatus,
        uploadStatus: entryForm.uploadStatus,
        title: entryForm.contentDetails.trim(),
        caption: entryForm.contentDetails.trim(),
        creativeUrl: entryForm.dataLink.trim(),
        status: entryForm.workStatus,
      };

      if (editingEntry) {
        await updateCalendarEntryAPI(clientId, editingEntry.id, payload);
        toast.success("Content entry updated in Google Sheets");
      } else {
        await createCalendarEntryAPI(clientId, payload);
        toast.success("Content entry added to Google Sheets");
      }

      setIsEntryModalOpen(false);
      loadEntries(selectedTab, true);
    } catch (err) {
      toast.error(err.message || "Failed to save entry to Google Sheets");
    } finally {
      setSavingEntry(false);
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (entry) => {
    const label = entry.contentDetails || entry.title || "this entry";
    if (
      !window.confirm(
        `Are you sure you want to delete "${label.slice(0, 35)}" from Google Sheets?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await deleteCalendarEntryAPI(clientId, entry.id, selectedTab);
      toast.success("Content entry deleted from Google Sheets");
      loadEntries(selectedTab, true);
    } catch (err) {
      toast.error(err.message || "Failed to delete entry");
    } finally {
      setLoading(false);
    }
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
      // Search query across content details, assignedTo, date, day
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDetails =
          (entry.contentDetails || entry.title || entry.caption || "")
            .toLowerCase()
            .includes(q);
        const matchAssigned = (entry.assignedTo || "").toLowerCase().includes(q);
        const matchType = (entry.contentType || "").toLowerCase().includes(q);
        const matchDate = (entry.date || "").toLowerCase().includes(q);
        const matchDay = (entry.day || "").toLowerCase().includes(q);
        if (!matchDetails && !matchAssigned && !matchType && !matchDate && !matchDay) {
          return false;
        }
      }
      return true;
    });
  }, [entries, contentTypeFilter, workStatusFilter, uploadStatusFilter, searchQuery]);

  // Status Badge Class Helpers (Show "-" when empty / unscheduled)
  const getWorkStatusBadge = (status) => {
    if (!status || !status.trim()) {
      return <span style={{ color: "var(--color-text-muted, #9ca3af)" }}>-</span>;
    }
    const s = status.toLowerCase().trim();
    if (s.includes("prog") || s.includes("work") || s.includes("wip")) {
      return <span className={`${styles.badgeStatus} ${styles.badgeInProgress}`}>In Progress</span>;
    }
    if (s.includes("done") || s.includes("comp") || s.includes("finish")) {
      return <span className={`${styles.badgeStatus} ${styles.badgeDone}`}>Done</span>;
    }
    if (s.includes("delay") || s.includes("hold") || s.includes("late")) {
      return <span className={`${styles.badgeStatus} ${styles.badgeDelayed}`}>Delayed</span>;
    }
    if (s.includes("pend") || s.includes("wait") || s.includes("draft")) {
      return <span className={`${styles.badgeStatus} ${styles.badgePending}`}>Pending</span>;
    }
    return <span className={`${styles.badgeStatus} ${styles.badgePending}`}>{status}</span>;
  };

  const getUploadStatusBadge = (status) => {
    if (!status || !status.trim()) {
      return <span style={{ color: "var(--color-text-muted, #9ca3af)" }}>-</span>;
    }
    const s = status.toLowerCase().trim();
    if (s.includes("upload") || s.includes("pub") || s.includes("live")) {
      return <span className={`${styles.badgeStatus} ${styles.badgeUploaded}`}>Uploaded</span>;
    }
    if (s.includes("sched") || s.includes("queue")) {
      return <span className={`${styles.badgeStatus} ${styles.badgeUploadScheduled}`}>Scheduled</span>;
    }
    if (s.includes("pend") || s.includes("draft")) {
      return <span className={`${styles.badgeStatus} ${styles.badgeUploadPending}`}>Pending</span>;
    }
    return <span className={`${styles.badgeStatus} ${styles.badgeUploadPending}`}>{status}</span>;
  };

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

    // Next month filler days to complete rows (proper Date math)
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

  // Index entries by Date string for lookup in Calendar Grid
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

  return (
    <div className={styles.container}>
      {/* 1. Header & Connection Bar */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <FaFileExcel className={styles.sheetIcon} />
          <div>
            <h3 className={styles.heading}>
              Content Calendar (Google Sheets)
              {statusData?.isConnected ? (
                <span className={`${styles.statusBadge} ${styles.statusConnected}`}>
                  <FiCheckCircle /> Connected
                </span>
              ) : statusData?.status === "error" ? (
                <span className={`${styles.statusBadge} ${styles.statusError}`}>
                  <FiAlertCircle /> Connection Error
                </span>
              ) : (
                <span className={`${styles.statusBadge} ${styles.statusDisconnected}`}>
                  Disconnected
                </span>
              )}
            </h3>
            {statusData?.sheetTitle && (
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #666)" }}>
                Spreadsheet: <strong>{statusData.sheetTitle}</strong>
              </span>
            )}
          </div>
        </div>

        <div className={styles.actionsArea}>
          {lastSynced && (
            <span className={styles.lastSynced}>
              Synced: {lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}

          {statusData?.isConnected && (
            <>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className={styles.btnSecondary}
                title="Refresh from Google Sheets"
              >
                <FiRefreshCw className={refreshing ? styles.spinning : ""} />
                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal()}
                  className={styles.btnPrimary}
                >
                  <FiPlus /> Add Content
                </button>
              )}
            </>
          )}

          {!readOnly && statusData?.isConnected && (
            <button
              type="button"
              onClick={handleDisconnectSpreadsheet}
              disabled={connecting}
              className={styles.btnDanger}
              title="Disconnect Google Spreadsheet"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* 2. Connection Form (If not connected) */}
      {!statusData?.isConnected && !readOnly && (
        <div style={{ background: "var(--soft-ivory, #f4f0e8)", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-border, rgba(34,34,34,0.1))", marginBottom: "1.5rem" }}>
          <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--charcoal-black, #222)", fontSize: "1rem" }}>
            Connect Client's Google Spreadsheet
          </h4>
          <p style={{ margin: "0 0 1rem 0", color: "var(--color-text-muted, #666)", fontSize: "0.85rem" }}>
            Enter the Google Spreadsheet URL. Make sure it is shared with our Service Account:{" "}
            <strong style={{ color: "var(--deep-forest, #0f5c44)" }}>
              {statusData?.serviceAccountEmail || "Service account email (configured in backend)"}
            </strong>{" "}
            with <em>Editor</em> permissions.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "260px" }} className={styles.inputWrapper}>
              <input
                type="url"
                value={sheetUrlInput}
                onChange={(e) => setSheetUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConnectSpreadsheet(e);
                  }
                }}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                disabled={connecting}
              />
            </div>
            <button
              type="button"
              onClick={handleConnectSpreadsheet}
              disabled={connecting}
              className={styles.btnSuccess}
            >
              {connecting ? "Validating & Connecting..." : "Connect Spreadsheet"}
            </button>
          </div>

          {statusData?.errorMessage && (
            <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", background: "var(--color-red-light, rgba(239, 79, 110, 0.1))", border: "1px solid rgba(239, 79, 110, 0.3)", borderRadius: "6px", color: "var(--warm-coral-red, #ef4f6e)", fontSize: "0.85rem" }}>
              <FiAlertCircle style={{ marginRight: "0.4rem" }} />
              {statusData.errorMessage}
            </div>
          )}
        </div>
      )}

      {/* 3. Monthly Tabs Bar with "+ New Month Tab" */}
      {statusData?.isConnected && (
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
                <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.25)", padding: "0.1rem 0.45rem", borderRadius: "999px" }}>
                  {filteredEntries.length}
                </span>
              )}
            </button>
          ))}

          {!readOnly && (
            <button
              type="button"
              onClick={() => setIsNewTabModalOpen(true)}
              className={styles.btnNewTab}
              title="Add New Month Tab (e.g. July 2026)"
            >
              <FiPlus /> New Month Tab
            </button>
          )}
        </div>
      )}

      {/* 4. Controls & Filters Bar */}
      {statusData?.isConnected && selectedTab && (
        <div className={styles.controlsBar}>
          <div className={styles.filterGroup}>
            <div className={styles.searchInput}>
              <FiSearch style={{ color: "var(--color-text-muted)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search details, assignee, date..."
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
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
              {WORK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  Work: {status}
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
              {UPLOAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  Upload: {status}
                </option>
              ))}
            </select>
          </div>

          {/* View Switchers: Only Table and Calendar (Cards removed per request) */}
          <div className={styles.viewSwitchers}>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`${styles.viewBtn} ${viewMode === "table" ? styles.viewBtnActive : ""}`}
              title="Table View"
            >
              <FiList /> Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`${styles.viewBtn} ${viewMode === "calendar" ? styles.viewBtnActive : ""}`}
              title="Calendar View"
            >
              <FiCalendar /> Calendar
            </button>
          </div>
        </div>
      )}

      {/* 5. Main Content Area */}
      {loading && !refreshing ? (
        <div className={styles.emptyState}>
          <div className={`${styles.emptyStateIcon} ${styles.spinning}`}>
            <FiRefreshCw />
          </div>
          <p>Loading content from Google Sheets...</p>
        </div>
      ) : !statusData?.isConnected ? (
        <div className={styles.emptyState}>
          <FiAlertCircle className={styles.emptyStateIcon} />
          <p>No Google Spreadsheet connected for this client yet.</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className={styles.emptyState}>
          <FiCalendar className={styles.emptyStateIcon} />
          <p>No content entries found in tab <strong>"{selectedTab}"</strong>.</p>
          {!readOnly && (
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className={styles.btnPrimary}
              style={{ marginTop: "1rem" }}
            >
              <FiPlus /> Add First Content Post
            </button>
          )}
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
                    <th>Assigned To</th>
                    <th>Work Status</th>
                    <th>Upload Status</th>
                    {!readOnly && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((post) => (
                    <tr key={post.id}>
                      {/* Date (DD/MM/YYYY) */}
                      <td style={{ whiteSpace: "nowrap", fontWeight: 600, color: "var(--deep-forest, #0f5c44)" }}>
                        {formatDateDDMMYYYY(post.date) || "-"}
                      </td>

                      {/* Day */}
                      <td style={{ whiteSpace: "nowrap", color: "var(--color-text-muted, #666)" }}>
                        {post.day || deriveDayOfWeek(post.date) || "-"}
                      </td>

                      {/* Content Type: Never defaults to Instagram Post if empty */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        {post.contentType && post.contentType.trim() ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                            <FaInstagram style={{ color: "var(--deep-forest, #0f5c44)" }} />
                            <strong>{post.contentType}</strong>
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted, #9ca3af)" }}>-</span>
                        )}
                      </td>

                      {/* Content Details */}
                      <td style={{ maxWidth: "300px", lineHeight: 1.4 }}>
                        <div style={{ color: "var(--charcoal-black, #222)" }}>
                          {post.contentDetails || post.title || post.caption || "-"}
                        </div>
                      </td>

                      {/* Ad Run (DD/MM/YYYY) */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        {post.adRun ? (
                          <span style={{ color: "var(--deep-forest, #0f5c44)", fontWeight: 600 }}>
                            {formatDateDDMMYYYY(post.adRun)}
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted, #9ca3af)" }}>-</span>
                        )}
                      </td>

                      {/* Data Link */}
                      <td>
                        {post.dataLink || post.creativeUrl ? (
                          <a
                            href={post.dataLink || post.creativeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.btnIcon}
                            title="Open Data Link (Media / Drive / Canva)"
                          >
                            <FiExternalLink />
                          </a>
                        ) : (
                          <span style={{ color: "var(--color-text-muted, #9ca3af)" }}>-</span>
                        )}
                      </td>

                      {/* Assigned To */}
                      <td style={{ minWidth: "140px" }}>
                        {post.assignedTo && post.assignedTo.trim() ? (
                          String(post.assignedTo)
                            .split(",")
                            .map((name, i) => (
                              <span key={i} className={styles.employeeChip}>
                                {name.trim()}
                              </span>
                            ))
                        ) : (
                          <span style={{ color: "var(--color-text-muted, #9ca3af)" }}>-</span>
                        )}
                      </td>

                      {/* Work Status */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        {getWorkStatusBadge(post.workStatus || post.status)}
                      </td>

                      {/* Upload Status */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        {getUploadStatusBadge(post.uploadStatus)}
                      </td>

                      {/* Actions */}
                      {!readOnly && (
                        <td>
                          <div style={{ display: "flex", gap: "0.35rem" }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(post)}
                              className={styles.btnIcon}
                              title="Edit Entry"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(post)}
                              className={styles.btnIcon}
                              style={{ color: "var(--warm-coral-red, #ef4f6e)" }}
                              title="Delete Entry"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      )}
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
                  onClick={() =>
                    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))
                  }
                  className={styles.btnIcon}
                  title="Previous Month"
                >
                  <FiChevronLeft />
                </button>
                <div className={styles.calendarNavTitle} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span>{calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--deep-forest, #0f5c44)", fontWeight: 500, background: "var(--soft-ivory, #f4f0e8)", padding: "0.15rem 0.6rem", borderRadius: "100px" }}>
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
                    style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", height: "auto" }}
                    title="Jump to active tab's month"
                  >
                    Sync to Tab
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
                  }
                  className={styles.btnIcon}
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
                  // Only show posts that actually have a scheduled Content Type
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
                        {!readOnly && day.isCurrentMonth && (
                          <button
                            type="button"
                            className={styles.dayAddBtn}
                            onClick={() => handleOpenCreateModal(day.fullDateStr)}
                            title="Add post on this date"
                          >
                            <FiPlus />
                          </button>
                        )}
                      </div>

                      <div className={styles.dayPostsList}>
                        {scheduledEntries.map((post) => (
                          <div
                            key={post.id}
                            className={styles.postPill}
                            onClick={() => !readOnly && handleOpenEditModal(post)}
                            title={`${post.contentType}${post.contentDetails ? `:\n${post.contentDetails}` : ""}\nWork: ${post.workStatus || "-"}\nUpload: ${post.uploadStatus || "-"}`}
                          >
                            <FaInstagram style={{ color: "var(--deep-forest, #0f5c44)", flexShrink: 0 }} />
                            <span className={styles.postPillText}>{post.contentType}</span>
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

      {/* 6. CREATE / EDIT MODAL */}
      {isEntryModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingEntry ? "Edit Content Entry" : "Create Content Entry"}</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsEntryModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <div>
              <div className={styles.modalBody}>
                {/* Date & Day row */}
                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Date (DD/MM/YYYY) *</label>
                    <div className={styles.inputWrapper}>
                      <input
                        type="date"
                        required
                        value={entryForm.date}
                        onChange={(e) => handleDateChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Day (Auto-calculated)</label>
                    <div className={styles.inputWrapper}>
                      <input
                        type="text"
                        readOnly
                        value={entryForm.day || "Calculated from date"}
                        style={{ color: "var(--color-text-muted, #777)", cursor: "not-allowed" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Content Type Dropdown */}
                <div className={styles.inputGroup}>
                  <label>Content Type *</label>
                  <div className={styles.inputWrapper}>
                    <select
                      value={entryForm.contentType}
                      onChange={(e) => setEntryForm({ ...entryForm, contentType: e.target.value })}
                    >
                      {CONTENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Content Details */}
                <div className={styles.inputGroup}>
                  <label>Content Details (Text / Caption / Script) *</label>
                  <div className={styles.inputWrapper}>
                    <textarea
                      rows={4}
                      required
                      value={entryForm.contentDetails}
                      onChange={(e) => setEntryForm({ ...entryForm, contentDetails: e.target.value })}
                      placeholder="Write content details, topic, caption or creative script..."
                    />
                  </div>
                </div>

                {/* Ad Run & Data Link */}
                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Ad Run (Date: DD/MM/YYYY)</label>
                    <div className={styles.inputWrapper}>
                      <input
                        type="date"
                        value={entryForm.adRun}
                        onChange={(e) => setEntryForm({ ...entryForm, adRun: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Data Link (URL / Canva / Drive)</label>
                    <div className={styles.inputWrapper}>
                      <input
                        type="url"
                        value={entryForm.dataLink}
                        onChange={(e) => setEntryForm({ ...entryForm, dataLink: e.target.value })}
                        placeholder="https://canva.com/... or Google Drive URL"
                      />
                    </div>
                  </div>
                </div>

                {/* Assigned To */}
                <div className={styles.inputGroup}>
                  <label>Assigned To (Employee names - comma separated for multiple)</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="text"
                      value={entryForm.assignedTo}
                      onChange={(e) => setEntryForm({ ...entryForm, assignedTo: e.target.value })}
                      placeholder="e.g. Dhruv, Anjali Sharma, Rohit"
                    />
                  </div>
                </div>

                {/* Work Status & Upload Status */}
                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Work Status *</label>
                    <div className={styles.inputWrapper}>
                      <select
                        value={entryForm.workStatus}
                        onChange={(e) => setEntryForm({ ...entryForm, workStatus: e.target.value })}
                      >
                        {WORK_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Upload Status *</label>
                    <div className={styles.inputWrapper}>
                      <select
                        value={entryForm.uploadStatus}
                        onChange={(e) => setEntryForm({ ...entryForm, uploadStatus: e.target.value })}
                      >
                        {UPLOAD_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsEntryModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEntry}
                  disabled={savingEntry}
                  className={styles.btnPrimary}
                >
                  {savingEntry
                    ? "Saving to Google Sheets..."
                    : editingEntry
                    ? "Update Entry"
                    : "Add to Google Sheet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. CREATE NEW MONTH TAB MODAL */}
      {isNewTabModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: "440px" }}>
            <div className={styles.modalHeader}>
              <h3>Add Month Tab</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsNewTabModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <div>
              <div className={styles.modalBody}>
                <p style={{ margin: "0 0 0.75rem 0", color: "var(--color-text-muted, #666)", fontSize: "0.85rem" }}>
                  Create a new monthly tab formatted as <strong>Month Year</strong> (e.g. July 2026).
                  Standard table headers will be initialized automatically.
                </p>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Month</label>
                    <div className={styles.inputWrapper}>
                      <select
                        value={newTabMonth}
                        onChange={(e) => setNewTabMonth(e.target.value)}
                      >
                        {[
                          "January",
                          "February",
                          "March",
                          "April",
                          "May",
                          "June",
                          "July",
                          "August",
                          "September",
                          "October",
                          "November",
                          "December",
                        ].map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Year</label>
                    <div className={styles.inputWrapper}>
                      <select
                        value={newTabYear}
                        onChange={(e) => setNewTabYear(e.target.value)}
                      >
                        {["2025", "2026", "2027", "2028"].map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "var(--soft-ivory, #f4f0e8)", borderRadius: "8px", border: "1px solid var(--color-border, rgba(34,34,34,0.1))" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #666)" }}>Tab name preview: </span>
                  <strong style={{ color: "var(--deep-forest, #0f5c44)" }}>{`${newTabMonth} ${newTabYear}`}</strong>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsNewTabModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateMonthTab}
                  disabled={creatingTab}
                  className={styles.btnPrimary}
                >
                  {creatingTab ? "Creating Tab..." : "Create Tab in Sheet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
