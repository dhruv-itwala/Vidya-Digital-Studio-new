import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Images } from "../../assets/Data/images";
import { NAVBAR_MENUS, SECTION_TITLES } from "../../config/navbarMenus";
import styles from "./Sidebar.module.css";
import { FiChevronDown, FiLogOut, FiX } from "react-icons/fi";

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar automatically on mobile when route changes
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [location.pathname]);

  const role = user?.role?.toLowerCase();
  let menu = [...(NAVBAR_MENUS[role] || [])];

  if (role === "employee" || role === "intern") {
    const hasLeads = user?.customPermissions?.includes("leads_manage");
    const hasClients = user?.customPermissions?.includes("clients_manage");
    const hasTasks = user?.customPermissions?.includes("tasks_manage");
    const hasReports = user?.customPermissions?.includes("reports_view");

    const pathPrefix = role === "intern" ? "employee" : role;

    let businessGroup = [];
    if (hasLeads) businessGroup.push({ label: "Leads", path: `/${pathPrefix}/leads` });
    if (hasClients) businessGroup.push({ label: "Clients", path: `/${pathPrefix}/clients` });

    if (businessGroup.length > 0) {
      menu.push("divider", ...businessGroup);
    }

    let extraGroup = [];
    if (hasTasks) extraGroup.push({ label: "All Tasks", path: `/${pathPrefix}/all-tasks` });
    if (hasReports) extraGroup.push({ label: "Reports", path: `/${pathPrefix}/reports` });

    if (extraGroup.length > 0) {
      menu.push("divider", ...extraGroup);
    }
  }

  const [openIndex, setOpenIndex] = useState(0); // Open first section by default

  const groupedMenu = [];
  let currentGroup = [];

  menu.forEach((item) => {
    if (item === "divider") {
      if (currentGroup.length) {
        groupedMenu.push(currentGroup);
        currentGroup = [];
      }
    } else {
      currentGroup.push(item);
    }
  });

  if (currentGroup.length) groupedMenu.push(currentGroup);

  const toggleGroup = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className={styles.overlay} onClick={onClose}></div>}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.logoContainer}>
          <div onClick={() => navigate("/")} style={{display: 'flex', alignItems: 'center'}}>
            <img src={Images.navbar_logo} alt="Vidya CRM" className={styles.logo} />
          </div>
          {/* Close button for mobile */}
          <button className={styles.closeBtn} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className={styles.scrollArea}>
          {groupedMenu.map((group, index) => (
            <div key={index} className={styles.section}>
              <div
                className={styles.sectionHeader}
                onClick={() => toggleGroup(index)}
              >
                <span className={styles.sectionTitle}>
                  {SECTION_TITLES[role]?.[index] || `Section ${index + 1}`}
                </span>
                <FiChevronDown
                  className={`${styles.chevron} ${
                    openIndex === index ? styles.openChevron : ""
                  }`}
                />
              </div>

              <div
                className={`${styles.menuItems} ${
                  openIndex === index ? styles.itemsOpen : ""
                }`}
              >
                {group.map((item, i) => {
                  const isActive = location.pathname.includes(item.path);
                  return (
                    <button
                      key={i}
                      onClick={() => navigate(item.path)}
                      className={`${styles.menuItem} ${
                        isActive ? styles.active : ""
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <FiLogOut className={styles.logoutIcon} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
