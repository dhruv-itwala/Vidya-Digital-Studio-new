import { Images } from "../../assets/Data/images";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <div className={styles.navbarWrapper}>
      <div className="masterContainer">
        <div className={styles.navbar}>
          <div className={styles.logo}>
            <img src={Images.navbar_logo} alt="VIDYA Digital Studio" />
          </div>

          {/* <div className={styles.links}>
            <a>PORTFOLIO</a>
            <a>SERVICES</a>
            <a>ABOUT US</a>
            <a>PACKAGES</a>
          </div> */}

          <div className={styles.rightButtons}>
            <button className={styles.contactBtn}>Contact us</button>
            {/* <a className={styles.loginLink}>Client Login</a> */}
          </div>
        </div>
      </div>
    </div>
  );
}
