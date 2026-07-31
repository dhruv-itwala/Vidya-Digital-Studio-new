import { FiCheckCircle, FiActivity, FiLayers } from "react-icons/fi";
import styles from "./TaskAnalytics.module.css";

export default function TaskAnalytics({ tasks }) {
  const activeCount = tasks.filter((t) => t.status !== "complete").length;
  const completedCount = tasks.filter((t) => t.status === "complete").length;
  const totalCount = tasks.length;

  return (
    <div className={styles.grid}>
      <div className={`${styles.card} ${styles.total}`}>
        <div className={styles.iconWrapperNeutral}>
          <FiLayers />
        </div>
        <div className={styles.cardContent}>
          <h3>{totalCount}</h3>
          <p>Total Tasks</p>
        </div>
      </div>
      <div className={`${styles.card} ${styles.active}`}>
        <div className={styles.iconWrapperOrange}>
          <FiActivity />
        </div>
        <div className={styles.cardContent}>
          <h3>{activeCount}</h3>
          <p>Active Tasks</p>
        </div>
      </div>
      <div className={`${styles.card} ${styles.completed}`}>
        <div className={styles.iconWrapperGreen}>
          <FiCheckCircle />
        </div>
        <div className={styles.cardContent}>
          <h3>{completedCount}</h3>
          <p>Completed Tasks</p>
        </div>
      </div>
    </div>
  );
}
