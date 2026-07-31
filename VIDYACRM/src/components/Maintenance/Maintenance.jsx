import styles from "./Maintenance.module.css";
import { Link } from "react-router-dom";

export default function Maintenance(error) {
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
        <h1>Site is under Maintenance</h1>
        <p>
          Our site is currently undergoing scheduled maintenance. <br />
          We’ll be back online shortly. Thanks for your patience!
        </p>
        <p>
          If the issue persists for more than <strong>5–10 minutes</strong>,
          <br />
          please contact the system administrator or development team for
          assistance.
        </p>
      </div>
    </div>
  );
}
