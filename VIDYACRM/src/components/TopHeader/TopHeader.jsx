import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/name.util";
import styles from "./TopHeader.module.css";
import {
  enablePushNotifications,
  getNotificationStatus,
} from "../../services/pushNotification";
import { FiBell, FiSearch } from "react-icons/fi";

export default function TopHeader({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();

  // Push Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifStatus, setNotifStatus] = useState("checking");
  const [loadingNotif, setLoadingNotif] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    getNotificationStatus().then((res) => {
      setNotifStatus(res.status);
    });
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (!notifRef.current?.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Format pathname to a readable title
  const pathParts = location.pathname.split("/").filter(Boolean);
  const pageTitle =
    pathParts.length > 0
      ? pathParts[pathParts.length - 1].replace(/-/g, " ")
      : "Dashboard";

  return (
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
          >
            <FiBell />
            {notifStatus === "enabled" && <span className={styles.notifDot}></span>}
          </button>

          {notifOpen && (
            <div className={styles.notifDropdown}>
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
  );
}
