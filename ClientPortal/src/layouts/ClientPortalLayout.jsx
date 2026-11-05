import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  FiShield,
  FiExternalLink,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
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
  const location = useLocation();

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

  const menuItems = [
    { path: ".", icon: <FiHome />, label: "Dashboard", end: true },
    { path: "calendar", icon: <FiCalendar />, label: "Content Calendar" },
    { path: "invoices", icon: <FiFileText />, label: "Invoices & Billing" },
    { path: "assets", icon: <FiKey />, label: "Assets & Logins" },
    // { path: "documents", icon: <FiFolder />, label: "Documents" },
    { path: "profile", icon: <FiUser />, label: "Client Profile" },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const clientName = clientInfo?.clientName || clientInfo?.companyName || "Client Portal";
  const avatarUrl = clientInfo?.profilePhoto?.url || "";
  const planTitle = clientInfo?.planDetails ? "Active Retainer" : "Client Workspace";

  // Compute current page title for the desktop topbar
  const getCurrentPageTitle = () => {
    const p = location.pathname.replace(/\/$/, "");
    if (p.endsWith("/calendar")) return "Content Calendar";
    if (p.endsWith("/invoices")) return "Invoices & Billing";
    if (p.endsWith("/assets")) return "Assets & Platform Logins";
    // if (p.endsWith("/documents")) return "Documents & Deliverables";
    if (p.endsWith("/profile")) return "Client Profile";
    return "Executive Dashboard";
  };

  return (
    <div className={styles.layoutContainer}>
      {/* Mobile Top Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileBrandRow}>
          <div className={`${styles.brandLogoWrap} ${avatarUrl ? styles.brandLogoWrapImg : ""}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={clientName} className={styles.brandLogoImg} />
            ) : (
              clientName.charAt(0).toUpperCase()
            )}
          </div>
          <div className={styles.mobileBrandText}>
            <div className={styles.brandTitle} title={clientName}>{clientName}</div>
            <div className={styles.brandBadge}>
              <span className={styles.pulseDot} />
              <span>{clientInfo?.ownerName ? `${clientInfo.ownerName} · Active` : "Active Retainer"}</span>
            </div>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          className={styles.menuButton}
          onClick={toggleSidebar}
          aria-label="Toggle Navigation"
        >
          {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </motion.button>
      </header>

      {/* Mobile Backdrop with Animation */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.backdrop}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
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
                  <span>{planTitle}</span>
                </span>
              </div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            className={styles.collapseToggleBtn}
            onClick={toggleCollapse}
            title={isCollapsed ? `Expand sidebar (${clientName})` : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
          </motion.button>
        </div>

        <nav className={styles.navMenu}>
          {!isCollapsed && <div className={styles.navSectionLabel}>Workspace</div>}
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
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className={styles.activePillBackground}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={styles.navIcon}>{item.icon}</span>
                  {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
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
                  {clientInfo?.ownerName || "Authorized Account"}
                </div>
              </div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className={`${styles.logoutButton} ${
              isCollapsed ? styles.logoutButtonCollapsed : ""
            }`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <span className={styles.logoutIcon}>
              <FiLogOut size={15} />
            </span>
            {!isCollapsed && <span>Sign Out</span>}
          </motion.button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Top Header Bar for Desktop */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <div className={styles.pageBreadcrumb}>
              <span className={styles.crumbWorkspace}>{clientName}</span>
              <span className={styles.crumbDivider}>/</span>
              <span className={styles.crumbCurrent}>{getCurrentPageTitle()}</span>
            </div>
          </div>

          <div className={styles.topBarRight}>
            <div className={styles.liveSyncBadge} title="Real-time studio sync active">
              <span className={styles.livePulseDot} />
              <span>Studio Live</span>
            </div>

            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              href="https://wa.me/919427507758"
              target="_blank"
              rel="noreferrer"
              className={styles.supportQuickBtn}
              title="Chat with your Dedicated Studio Executive"
            >
              <FaWhatsapp className={styles.whatsappIcon} />
              <span className={styles.supportQuickText}>Studio Support</span>
            </motion.a>
          </div>
        </header>

        {/* Content Outlet with smooth route entrance */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={styles.contentWrapper}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default ClientPortalLayout;
