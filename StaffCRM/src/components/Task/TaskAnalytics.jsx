import styles from "./TaskAnalytics.module.css";

export default function TaskAnalytics({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "complete").length;
  const active = tasks.filter((t) => t.status === "started").length;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // reset time to midnight

  return (
    <div className={styles.grid}>
      <Card label="Total Tasks" value={total} total />
      <Card label="Active" value={active} active />
      <Card label="Completed" value={completed} completed />
    </div>
  );
}

const Card = ({ label, value, total, active, completed }) => (
  <div
    className={`${styles.card} ${
      total
        ? styles.total
        : active
        ? styles.active
        : completed
        ? styles.completed
        : ""
    }`}
  >
    <p>{label}</p>
    <h3>{value}</h3>
  </div>
);
