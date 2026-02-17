import { useMemo } from "react";
import styles from "./TaskAnalytics.module.css";

export default function TaskAnalytics({ tasks }) {
  const stats = useMemo(() => {
    let total = tasks.length;
    let completed = 0;
    let active = 0;

    for (const task of tasks) {
      if (task.status === "complete") completed++;
      if (task.status === "started") active++;
    }

    return { total, completed, active };
  }, [tasks]);

  return (
    <div className={styles.grid}>
      <Card label="Total Tasks" value={stats.total} variant="total" />
      <Card label="Active" value={stats.active} variant="active" />
      <Card label="Completed" value={stats.completed} variant="completed" />
    </div>
  );
}

const Card = ({ label, value, variant }) => (
  <div className={`${styles.card} ${styles[variant]}`}>
    <p className={styles.label}>{label}</p>
    <h3 className={styles.value}>{value}</h3>
  </div>
);
