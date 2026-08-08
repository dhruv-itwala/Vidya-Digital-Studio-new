import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import styles from "./ClientPortalLayout.module.css";
import {
  FiHome,
  FiUser,
  FiKey,
  FiFolder,
  FiFileText,
  FiActivity,
  FiLogOut,
  FiMenu,
  FiX
} from "react-icons/fi";

const ClientPortalLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("clientToken");
    localStorage.removeItem("clientData");
    navigate("/client-login");
  };

  const menuItems = [
    { path: ".", icon: <FiHome />, label: "Dashboard", end: true },
    { path: "profile", icon: <FiUser />, label: "Profile" },
    { path: "assets", icon: <FiKey />, label: "Assets & Logins" },
    { path: "documents", icon: <FiFolder />, label: "Documents" },
    { path: "invoices", icon: <FiFileText />, label: "Invoices" },
    { path: "transactions", icon: <FiActivity />, label: "Transactions" },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={styles.layoutContainer}>
      {/* Mobile Header */}
      <div className={styles.mobileHeader}>
        <div className={styles.logoContainer}>
          <span className={styles.logoText}>Portal View</span>
        </div>
        <button className={styles.menuButton} onClick={toggleSidebar}>
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logoText}>Portal View</span>
        </div>

        <nav className={styles.navMenu}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={() => navigate(-1)} className={styles.logoutButton} style={{color: '#4b5563'}}>
            <span className={styles.navIcon}><FiLogOut style={{transform: 'rotate(180deg)'}} /></span>
            <span className={styles.navLabel}>Back to CRM</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <Outlet />
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)}></div>
      )}
    </div>
  );
};

export default ClientPortalLayout;
