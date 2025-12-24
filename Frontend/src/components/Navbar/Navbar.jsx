import { useState } from "react";
import { navbarMedia } from "../../assets/Data/MasterData";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <div className={styles.navbarWrapper}>
      <div className="masterContainer">
        <div className={styles.navbar}>
          {/* Logo */}
          <div className={styles.logo}>
            <img src={navbarMedia.navbar_logo} alt="VIDYA Digital Studio" />
          </div>

          {/* Desktop Navigation */}
          <div className={styles.links}>
            <a>OUR WORK</a>
            <a>SERVICES</a>
            <a>ABOUT US</a>
            <a>BLOGS & ARTICLES</a>
            <a>PRICING</a>
          </div>

          {/* Contact Button */}
          <div className={styles.rightButtons}>
            <button className={styles.contactBtn}>Contact Us</button>
          </div>

          {/* Hamburger */}
          <div
            className={styles.hamburger}
            onClick={() => setOpenMenu(!openMenu)}
          >
            ☰
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {openMenu && (
        <div className={styles.mobileMenu}>
          <a>OUR WORK</a>
          <a>SERVICES</a>
          <a>ABOUT US</a>
          <a>BLOGS & ARTICLES</a>
          <a>PRICING</a>

          <button className={styles.contactBtnMobile}>Contact Us</button>
        </div>
      )}
    </div>
  );
}
