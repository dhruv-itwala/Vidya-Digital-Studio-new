import styles from "./PNF.module.css";
import { Link } from "react-router-dom";

export default function UnderMaintenance(error) {
  console.log("Maintenance Error:", error);
  return (
    <div className={styles.container}>
      <div className={styles.svgWrapper}>
        <img
          src="/UnderConstruction.svg"
          alt="Under Maintenance"
          className={styles.image}
        />
      </div>
      <div className={styles.content}>
        <h1>Site is under Maintainance</h1>
        <p>
          Our site is currently undergoing scheduled maintenance. <br />
          We’ll be back online shortly. Thanks for your patience!
        </p>
        <Link to="https://vidyadigitalstudio.com" className={styles.button}>
          Explore our services
        </Link>
      </div>
    </div>
  );
}
