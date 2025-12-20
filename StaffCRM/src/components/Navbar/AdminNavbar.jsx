import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/name.util";
import { Images } from "../../assets/Data/images";
import styles from "./Navbar.module.css";

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

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
          <div
            className={styles.logo}
            onClick={() => navigate("/admin/attendance")}
          >
            <img src={Images.navbar_logo} alt="VIDYA Digital Studio" />
          </div>

          {/* Right side */}
          <div className={styles.rightButtons} ref={dropdownRef}>
            <div className={styles.profileBtn} onClick={() => setOpen(!open)}>
              <div className={styles.avatar}>{getInitials(user?.name)}</div>
              <span className={styles.userName}>{user?.name}</span>
            </div>

            {open && (
              <div className={styles.dropdown}>
                <button onClick={() => goTo("/admin/employees")}>
                  Employees
                </button>
                <button onClick={() => goTo("/admin/tasks")}>Tasks</button>
                <button onClick={() => goTo("/admin/attendance")}>
                  Attendance
                </button>
                <button onClick={() => goTo("/admin/reports")}>Reports</button>

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
