import styles from "./TaskAnalytics.module.css";

export default function TaskAnalytics({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "complete").length;
  const active = tasks.filter((t) => t.status === "started").length;
  const overdue = tasks.filter(
    (t) => t.endDate && new Date(t.endDate) < new Date()
  ).length;

  return (
    <div className={styles.grid}>
      <Card label="Total Tasks" value={total} />
      <Card label="Active" value={active} />
      <Card label="Completed" value={completed} />
      <Card label="Overdue" value={overdue} danger />
    </div>
  );
}

const Card = ({ label, value, danger }) => (
  <div className={`${styles.card} ${danger ? styles.danger : ""}`}>
    <p>{label}</p>
    <h3>{value}</h3>
  </div>
);
