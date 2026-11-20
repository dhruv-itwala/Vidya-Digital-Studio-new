import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Images } from "../../assets/Data/images";
import { NAVBAR_MENUS, SECTION_TITLES } from "../../config/navbarMenus";
import styles from "./Sidebar.module.css";
import {
  FiGrid,
  FiCheckSquare,
  FiUser,
  FiCalendar,
  FiHelpCircle,
  FiList,
  FiCamera,
  FiVideo,
  FiFileText,
  FiDollarSign,
  FiTrendingUp,
  FiPieChart,
  FiCreditCard,
  FiUserPlus,
  FiUsers,
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiLayers,
  FiSun,
  FiBarChart2,
  FiSettings,
  FiAward,
  FiHeadphones,
  FiBell,
  FiShield,
  FiChevronDown,
  FiChevronsLeft,
  FiChevronsRight,
  FiLogOut,
  FiX,
  FiCircle,
} from "react-icons/fi";
import minilogo from "../../../public/favicon.svg";
const getMenuIcon = (label = "") => {
  const key = label.trim().toLowerCase();
  switch (key) {
    case "dashboard":
      return FiGrid;
    case "task list":
      return FiCheckSquare;
    case "profile":
      return FiUser;
    case "leaves":
      return FiCalendar;
    case "helpdesk":
      return FiHelpCircle;
    case "to do list":
      return FiList;
    case "influencers":
      return FiCamera;
    case "ugc creators":
      return FiVideo;
    case "quotations":
      return FiFileText;
    case "invoices":
      return FiDollarSign;
    case "finance & cash flow":
      return FiTrendingUp;
    case "expenses & bills":
      return FiPieChart;
    case "bank & cash accounts":
      return FiCreditCard;
    case "leads":
      return FiUserPlus;
    case "clients":
      return FiUsers;
    case "whatsapp chats":
      return FiMessageSquare;
    case "employees":
      return FiUsers;
    case "attendance":
      return FiClock;
    case "mark attendance":
      return FiCheckCircle;
    case "tasks":
    case "all tasks":
      return FiLayers;
    case "holidays":
      return FiSun;
    case "reports":
      return FiBarChart2;
    case "leave approvals":
      return FiCheckCircle;
    case "settings":
      return FiSettings;
    case "payroll":
      return FiAward;
    case "hr helpdesk":
      return FiHeadphones;
    case "notice board":
      return FiBell;
    case "payslips":
      return FiFileText;
    case "hr":
      return FiShield;
    default:
      return FiCircle;
  }
};

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed: propIsCollapsed,
  onToggleCollapse: propToggleCollapse,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Internal collapse fallback if props not provided
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const isCollapsed =
    propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (propToggleCollapse) {
      propToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("sidebar_collapsed", String(next));
        } catch (e) {
          // ignore
        }
        return next;
      });
    }
  };

  // Hover tooltip state for collapsed rail mode
  const [hoveredTooltip, setHoveredTooltip] = useState(null); // { label, top }

  const handleItemMouseEnter = (label, e) => {
    if (!isCollapsed || window.innerWidth <= 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      label,
      top: rect.top + rect.height / 2,
    });
  };

  const handleItemMouseLeave = () => {
    setHoveredTooltip(null);
  };

  // Close sidebar automatically on mobile when route changes
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
    setHoveredTooltip(null);
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
    if (hasLeads)
      businessGroup.push({ label: "Leads", path: `/${pathPrefix}/leads` });
    if (hasClients)
      businessGroup.push({ label: "Clients", path: `/${pathPrefix}/clients` });

    if (businessGroup.length > 0) {
      menu.push("divider", ...businessGroup);
    }

    let extraGroup = [];
    if (hasTasks)
      extraGroup.push({
        label: "All Tasks",
        path: `/${pathPrefix}/all-tasks`,
      });
    if (hasReports)
      extraGroup.push({ label: "Reports", path: `/${pathPrefix}/reports` });

    if (extraGroup.length > 0) {
      menu.push("divider", ...extraGroup);
    }
  }

  const [openIndex, setOpenIndex] = useState(0); // Open first section by default in expanded mode

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

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ""} ${
          isCollapsed ? styles.collapsed : ""
        }`}
      >
        {/* Logo and Collapse Toggle Header */}
        <div className={styles.logoContainer}>
          {!isCollapsed ? (
            <>
              <div
                onClick={() => navigate("/")}
                className={styles.logoClickable}
              >
                <img
                  src={Images.navbar_logo}
                  alt="Vidya CRM"
                  className={styles.logo}
                />
              </div>
              <button
                type="button"
                className={styles.collapseBtn}
                onClick={toggleCollapse}
                title="Collapse to mini rail"
                aria-label="Collapse sidebar"
              >
                <FiChevronsLeft />
              </button>
            </>
          ) : (
            <div className={styles.collapsedHeader}>
              <button
                type="button"
                className={styles.collapseBtn}
                onClick={toggleCollapse}
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <img src={Images.mini_logo} alt="" className={styles.collapseLogo} />
              </button>
            </div>
          )}

          {/* Close button for mobile drawer */}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <FiX />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div
          className={styles.scrollArea}
          onScroll={() => setHoveredTooltip(null)}
        >
          {groupedMenu.map((group, index) => {
            const sectionTitle =
              SECTION_TITLES[role]?.[index] || `Section ${index + 1}`;
            return (
              <div key={index} className={styles.section}>
                {!isCollapsed ? (
                  <div
                    className={styles.sectionHeader}
                    onClick={() => toggleGroup(index)}
                  >
                    <span className={styles.sectionTitle}>{sectionTitle}</span>
                    <FiChevronDown
                      className={`${styles.chevron} ${
                        openIndex === index ? styles.openChevron : ""
                      }`}
                    />
                  </div>
                ) : (
                  index > 0 && <div className={styles.collapsedSectionDivider} />
                )}

                <div
                  className={`${styles.menuItems} ${
                    isCollapsed || openIndex === index ? styles.itemsOpen : ""
                  }`}
                >
                  {group.map((item, i) => {
                    const isActive = location.pathname.includes(item.path);
                    const IconComponent = getMenuIcon(item.label);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => navigate(item.path)}
                        onMouseEnter={(e) => handleItemMouseEnter(item.label, e)}
                        onMouseLeave={handleItemMouseLeave}
                        className={`${styles.menuItem} ${
                          isActive ? styles.active : ""
                        }`}
                        title={isCollapsed ? undefined : item.label}
                      >
                        <IconComponent className={styles.itemIcon} />
                        {!isCollapsed && (
                          <span className={styles.itemLabel}>{item.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Footer / Logout */}
        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.logoutBtn} ${
              isCollapsed ? styles.logoutBtnCollapsed : ""
            }`}
            onClick={handleLogout}
            onMouseEnter={(e) => handleItemMouseEnter("Logout", e)}
            onMouseLeave={handleItemMouseLeave}
            title={isCollapsed ? undefined : "Logout"}
          >
            <FiLogOut className={styles.logoutIcon} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Floating Tooltip in Collapsed Rail Mode */}
        {isCollapsed && hoveredTooltip && (
          <div
            className={styles.floatingTooltip}
            style={{ top: `${hoveredTooltip.top}px` }}
          >
            {hoveredTooltip.label}
          </div>
        )}
      </aside>
    </>
  );
}
