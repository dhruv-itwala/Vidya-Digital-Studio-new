import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiHome, FiUser, FiFolder, FiFileText, FiActivity, FiLogOut, FiKey } from "react-icons/fi";
import styles from "./ClientPortalLayout.module.css";

const ClientPortalLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("clientToken");
    localStorage.removeItem("clientData");
    navigate("/login");
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
      <div className={styles.mobileHeader}>
        <div className={styles.logoContainer}>
          <span className={styles.logoText}>Client Portal</span>
        </div>
        <button className={styles.menuButton} onClick={toggleSidebar}>
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logoText}>Client Portal</span>
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
          <button onClick={handleLogout} className={styles.logoutButton}>
            <span className={styles.navIcon}><FiLogOut /></span>
            <span className={styles.navLabel}>Logout</span>
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        <Outlet />
      </div>
    </div>
  );
};

export default ClientPortalLayout;
