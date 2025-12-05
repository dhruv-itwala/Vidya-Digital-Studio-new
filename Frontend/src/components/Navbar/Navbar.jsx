import { useState } from "react";
import { navbarMedia } from "../../assets/Data/MasterData";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <div className={styles.navbarWrapper}>
      <div className="masterContainer">
        <div className={styles.navbar}>
          {/* LEFT: Logo */}
          <div className={styles.logo}>
            <img src={navbarMedia.navbar_logo} alt="VIDYA Digital Studio" />
          </div>

          {/* RIGHT: Desktop Links */}
          <div className={styles.links}>
            <a>PORTFOLIO</a>
            <a>SERVICES</a>
            <a>ABOUT US</a>
            <a>PACKAGES</a>
          </div>

          {/* RIGHT: Desktop Buttons */}
          <div className={styles.rightButtons}>
            <button className={styles.contactBtn}>Contact us</button>
            <a className={styles.loginLink}>Client Login</a>
          </div>

          {/* Hamburger Icon (Mobile) */}
          <div
            className={styles.hamburger}
            onClick={() => setOpenMenu(!openMenu)}
          >
            ☰
          </div>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {openMenu && (
        <div className={styles.mobileMenu}>
          <a>PORTFOLIO</a>
          <a>SERVICES</a>
          <a>ABOUT US</a>
          <a>PACKAGES</a>

          <button className={styles.contactBtnMobile}>Contact us</button>
          <button className={styles.contactBtnMobile}>Client Login</button>
        </div>
      )}
    </div>
  );
}
