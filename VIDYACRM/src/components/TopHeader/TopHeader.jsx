import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/name.util";
import styles from "./TopHeader.module.css";
import {
  enablePushNotifications,
  getNotificationStatus,
} from "../../services/pushNotification";
import {
  getMyCalendarRemindersAPI,
  updateCalendarEntryStatusAPI,
} from "../../api/contentCalendar.api";
import {
  FiBell,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function TopHeader({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();

  // Push Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifStatus, setNotifStatus] = useState("checking");
  const [loadingNotif, setLoadingNotif] = useState(false);
  const notifRef = useRef(null);

  // Content Calendar Reminders state
  const [reminders, setReminders] = useState([]);
  const [activeReminderIdx, setActiveReminderIdx] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getMyCalendarRemindersAPI();
      const list = res.data.data || [];
      setReminders(list);
    } catch (err) {
      // Non-blocking background reminder check
      console.warn("Failed to check calendar reminders", err);
    }
  }, [user]);

  useEffect(() => {
    getNotificationStatus().then((res) => {
      setNotifStatus(res.status);
    });
  }, [user]);

  useEffect(() => {
    fetchReminders();
    // Periodically re-check every 60 seconds
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  useEffect(() => {
    const handler = (e) => {
      if (!notifRef.current?.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Quick mark as Done action: updates Google Sheets cell & disappears immediately
  const handleMarkAsDone = async (reminder) => {
    if (!reminder) return;
    try {
      setUpdatingId(reminder.id);
      await updateCalendarEntryStatusAPI(reminder.clientId, reminder.rowId, {
        tab: reminder.tab,
        workStatus: "Done",
      });
      toast.success(`Completed! Reminder for ${reminder.clientName} dismissed.`);
      // Immediately remove from reminders state so it disappears
      setReminders((prev) => {
        const next = prev.filter((r) => r.id !== reminder.id);
        if (activeReminderIdx >= next.length && next.length > 0) {
          setActiveReminderIdx(next.length - 1);
        }
        return next;
      });
    } catch (err) {
      toast.error(err.message || "Failed to update work status to Done");
    } finally {
      setUpdatingId(null);
    }
  };

  // Format pathname to a readable title
  const pathParts = location.pathname.split("/").filter(Boolean);
  const pageTitle =
    pathParts.length > 0
      ? pathParts[pathParts.length - 1].replace(/-/g, " ")
      : "Dashboard";

  const currentReminder = reminders[activeReminderIdx] || reminders[0];

  return (
    <>
      {/* 1. TOP REMINDER BANNER (Shown when active reminder exists for logged-in user) */}
      {reminders.length > 0 && currentReminder && (
        <div className={styles.topReminderBanner}>
          <div className={styles.reminderLeft}>
            <span className={styles.reminderIcon}>
              <FiAlertCircle />
            </span>
            <span className={styles.reminderBadgeTag}>Reminder</span>
            <span className={styles.reminderText}>{currentReminder.message}</span>
            <span className={styles.reminderMeta}>
              <FiClock style={{ verticalAlign: "middle", marginRight: "4px" }} />
              Posting: {currentReminder.date} (
              {currentReminder.daysLeft <= 0
                ? currentReminder.daysLeft === 0
                  ? "Due Today"
                  : `${Math.abs(currentReminder.daysLeft)}d overdue`
                : `in ${currentReminder.daysLeft}d`}
              )
            </span>
          </div>

          <div className={styles.reminderRight}>
            <button
              type="button"
              className={styles.btnMarkDone}
              onClick={() => handleMarkAsDone(currentReminder)}
              disabled={updatingId === currentReminder.id}
              title="Mark work status as Done in Google Sheet"
            >
              <FiCheckCircle />
              <span>{updatingId === currentReminder.id ? "Updating..." : "Mark as Done"}</span>
            </button>

            {reminders.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  className={styles.btnNavArrow}
                  onClick={() =>
                    setActiveReminderIdx((prev) => (prev > 0 ? prev - 1 : reminders.length - 1))
                  }
                  title="Previous reminder"
                >
                  <FiChevronLeft />
                </button>
                <span style={{ fontSize: "0.8rem", color: "var(--deep-forest, #0f5c44)", fontWeight: 600 }}>
                  {activeReminderIdx + 1}/{reminders.length}
                </span>
                <button
                  type="button"
                  className={styles.btnNavArrow}
                  onClick={() =>
                    setActiveReminderIdx((prev) => (prev < reminders.length - 1 ? prev + 1 : 0))
                  }
                  title="Next reminder"
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MAIN HEADER BAR */}
      <header className={styles.topHeader}>
        <div className={styles.left}>
          {onMenuClick && (
            <button className={styles.hamburgerBtn} onClick={onMenuClick}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
          <h1 className={styles.pageTitle}>
            {pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1)}
          </h1>
        </div>

        <div className={styles.right}>
          {/* Fake Global Search for SaaS look */}
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input type="text" placeholder="Search..." className={styles.searchInput} />
          </div>

          {/* Notifications */}
          <div className={styles.notifWrapper} ref={notifRef}>
            <button
              className={`${styles.notifBtn} ${notifOpen ? styles.active : ""}`}
              onClick={() => setNotifOpen(!notifOpen)}
              title={reminders.length > 0 ? `${reminders.length} Content Reminders pending` : "Notifications"}
            >
              <FiBell />
              {reminders.length > 0 ? (
                <span className={styles.bellBadgeCount}>{reminders.length}</span>
              ) : (
                notifStatus === "enabled" && <span className={styles.notifDot}></span>
              )}
            </button>

            {notifOpen && (
              <div className={styles.notifDropdown}>
                {/* Content Calendar Reminders Section */}
                {reminders.length > 0 && (
                  <div className={styles.dropdownReminderSection}>
                    <div className={styles.dropdownSectionTitle}>
                      <span>Content Reminders</span>
                      <span className={styles.reminderBadgeTag}>{reminders.length} Pending</span>
                    </div>

                    <div style={{ maxHeight: "220px", overflowY: "auto", paddingRight: "4px" }}>
                      {reminders.map((rem) => (
                        <div key={rem.id} className={styles.dropdownReminderItem}>
                          <div className={styles.dropdownReminderMsg}>{rem.message}</div>
                          <div className={styles.dropdownReminderFooter}>
                            <span className={styles.dropdownDueDate}>
                              Due: {rem.date} (
                              {rem.daysLeft <= 0
                                ? rem.daysLeft === 0
                                  ? "Today"
                                  : `${Math.abs(rem.daysLeft)}d overdue`
                                : `in ${rem.daysLeft}d`}
                              )
                            </span>
                            <button
                              type="button"
                              className={styles.btnDropdownDone}
                              onClick={() => handleMarkAsDone(rem)}
                              disabled={updatingId === rem.id}
                            >
                              <FiCheckCircle />
                              <span>{updatingId === rem.id ? "..." : "Done"}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Notification Header */}
                <div className={styles.notifHeader}>
                  <span>Notifications</span>
                  <span
                    className={`${styles.notifBadge} ${
                      notifStatus === "enabled"
                        ? styles.badgeActive
                        : styles.badgeInactive
                    }`}
                  >
                    {notifStatus === "enabled" ? "Active" : "Off"}
                  </span>
                </div>
                <div className={styles.notifBody}>
                  <p>Receive real-time alerts across devices.</p>
                  <button
                    className={styles.notifActionBtn}
                    onClick={async () => {
                      setLoadingNotif(true);
                      await enablePushNotifications();
                      const res = await getNotificationStatus();
                      setNotifStatus(res.status);
                      setLoadingNotif(false);
                    }}
                    disabled={loadingNotif}
                  >
                    {loadingNotif ? "Enabling..." : "Enable Notifications"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile (just display, actions moved to Sidebar) */}
          <div className={styles.profile}>
            {user?.profilePicture?.url ? (
              <img
                src={user.profilePicture.url}
                alt={user.name}
                className={styles.avatarImg}
              />
            ) : (
              <div className={styles.avatar}>{getInitials(user?.name)}</div>
            )}
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userRole}>{user?.role}</span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
