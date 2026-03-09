import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/name.util";
import { Images } from "../../assets/Data/images";
import { NAVBAR_MENUS } from "../../config/navbarMenus";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const role = user?.role?.toLowerCase();
  const menu = NAVBAR_MENUS[role] || [];

  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setOpen(false);
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
              <div className={styles.avatar}>{getInitials(user?.name)}</div>
              <span className={styles.userName}>{user?.name}</span>
            </div>

            {open && (
              <div className={styles.dropdown}>
                {menu.map((item, i) =>
                  item === "divider" ? (
                    <hr key={i} />
                  ) : (
                    <button key={i} onClick={() => goTo(item.path)}>
                      {item.label}
                    </button>
                  ),
                )}

                <hr />

                <button className={styles.logout} onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
