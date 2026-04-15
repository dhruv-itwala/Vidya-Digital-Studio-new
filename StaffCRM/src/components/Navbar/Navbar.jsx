import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/name.util";
import { Images } from "../../assets/Data/images";
import { NAVBAR_MENUS, SECTION_TITLES } from "../../config/navbarMenus";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  const dropdownRef = useRef(null);

  const role = user?.role?.toLowerCase();
  const menu = NAVBAR_MENUS[role] || [];

  // 👉 Convert menu into grouped sections using "divider"
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

  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setOpen(false);
        setOpenIndex(null);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const goTo = (path) => {
    navigate(path);
    setOpen(false);
    setOpenIndex(null);
  };

  const toggleGroup = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={styles.navbarWrapper}>
      <div className="masterContainer">
        <div className={styles.navbar}>
          {/* Logo */}
          <div className={styles.logo} onClick={() => navigate("/")}>
            <img src={Images.navbar_logo} alt="VIDYA Digital Studio" />
          </div>

          {/* Profile */}
          <div className={styles.rightButtons} ref={dropdownRef}>
            <div className={styles.profileBtn} onClick={() => setOpen(!open)}>
              {user?.profilePicture?.url ? (
                <img
                  src={user.profilePicture.url}
                  alt={user.name}
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatar}>{getInitials(user?.name)}</div>
              )}
              <span className={styles.userName}>{user?.name}</span>
            </div>

            {open && (
              <div className={styles.dropdown}>
                {groupedMenu.map((group, index) => (
                  <div key={index} className={styles.group}>
                    {/* Header */}
                    <div
                      className={styles.groupHeader}
                      onClick={() => toggleGroup(index)}
                    >
                      <span>
                        {SECTION_TITLES[role]?.[index] ||
                          `Section ${index + 1}`}
                      </span>
                      <span>{openIndex === index ? "−" : "+"}</span>
                    </div>

                    {/* Items */}
                    {openIndex === index && (
                      <div className={styles.groupItems}>
                        {group.map((item, i) => (
                          <button key={i} onClick={() => goTo(item.path)}>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Sticky Logout */}
                <div className={styles.logoutWrapper}>
                  <button className={styles.logout} onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
