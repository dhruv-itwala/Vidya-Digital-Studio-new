import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiHome,
  FiUser,
  FiFolder,
  FiFileText,
  FiLogOut,
  FiKey,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import styles from "./ClientPortalLayout.module.css";
import clientApi from "../api/clientAxios";

const ClientPortalLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("clientSidebarCollapsed") === "true";
    } catch (e) {
      return false;
    }
  });
  const [clientInfo, setClientInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Try to read cached clientData
    const cached = localStorage.getItem("clientData");
    if (cached) {
      try {
        setClientInfo(JSON.parse(cached));
      } catch (e) {}
    }

    // Refresh client profile
    clientApi
      .get("/client-portal/me")
      .then((res) => {
        if (res.data?.data) {
          setClientInfo(res.data.data);
          localStorage.setItem("clientData", JSON.stringify(res.data.data));
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("clientToken");
    localStorage.removeItem("clientData");
    navigate("/login");
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("clientSidebarCollapsed", String(next));
      } catch (e) {}
      return next;
    });
  };

  // Explicitly removed Transactions per studio requirements
  const menuItems = [
    { path: ".", icon: <FiHome />, label: "Dashboard", end: true },
    { path: "calendar", icon: <FiCalendar />, label: "Content Calendar" },
    { path: "invoices", icon: <FiFileText />, label: "Invoices" },
    { path: "assets", icon: <FiKey />, label: "Assets & Logins" },
    { path: "documents", icon: <FiFolder />, label: "Documents" },
    { path: "profile", icon: <FiUser />, label: "Profile" },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const clientName = clientInfo?.clientName || clientInfo?.companyName || "Client Portal";
  const avatarUrl = clientInfo?.profilePhoto?.url || "";

  return (
    <div className={styles.layoutContainer}>
      {/* Mobile Top Header */}
      <div className={styles.mobileHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, overflow: "hidden" }}>
          <div className={`${styles.brandLogoWrap} ${avatarUrl ? styles.brandLogoWrapImg : ""}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={clientName} className={styles.brandLogoImg} />
            ) : (
              clientName.charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div className={styles.brandTitle} title={clientName}>{clientName}</div>
            <div className={styles.brandBadge}>
              <span className={styles.pulseDot} />
              {clientInfo?.ownerName ? `${clientInfo.ownerName} · Client Portal` : "Client Workspace"}
            </div>
          </div>
        </div>
        <button
          className={styles.menuButton}
          onClick={toggleSidebar}
          aria-label="Toggle Navigation"
        >
          {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation (Sticky on Left & Collapsible) */}
      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""} ${
          sidebarOpen ? styles.sidebarOpen : ""
        }`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.brandGroup} title={clientName}>
            <div className={`${styles.brandLogoWrap} ${avatarUrl ? styles.brandLogoWrapImg : ""}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={clientName} className={styles.brandLogoImg} />
              ) : (
                clientName.charAt(0).toUpperCase()
              )}
            </div>
            {!isCollapsed && (
              <div className={styles.brandDetails}>
                <span className={styles.brandTitle} title={clientName}>{clientName}</span>
                <span className={styles.brandBadge}>
                  <span className={styles.pulseDot} />
                  {clientInfo?.ownerName ? `${clientInfo.ownerName} · Workspace` : "Client Workspace"}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.collapseToggleBtn}
            onClick={toggleCollapse}
            title={isCollapsed ? `Expand sidebar (${clientName})` : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <FiChevronRight size={15} /> : <FiChevronLeft size={15} />}
          </button>
        </div>

        <nav className={styles.navMenu}>
          {!isCollapsed && <div className={styles.navSectionLabel}>Workspace Navigation</div>}
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ""} ${
                  isCollapsed ? styles.navItemCollapsed : ""
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div
            className={`${styles.clientSnippet} ${
              isCollapsed ? styles.clientSnippetCollapsed : ""
            }`}
            title={isCollapsed ? clientName : undefined}
          >
            <div className={styles.clientSnippetAvatar}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={clientName} />
              ) : (
                clientName.charAt(0).toUpperCase()
              )}
            </div>
            {!isCollapsed && (
              <div className={styles.clientSnippetMeta}>
                <div className={styles.clientSnippetName}>{clientName}</div>
                <div className={styles.clientSnippetRole}>
                  {clientInfo?.ownerName ? `${clientInfo.ownerName} · Active` : "Active Retainer"}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={`${styles.logoutButton} ${
              isCollapsed ? styles.logoutButtonCollapsed : ""
            }`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <span className={styles.navIcon}>
              <FiLogOut size={16} />
            </span>
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Outlet */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ClientPortalLayout;
