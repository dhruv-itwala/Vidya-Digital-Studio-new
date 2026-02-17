import styles from "./Task.module.css";

export default function TaskStatusBadge({ status }) {
  return (
    <span className={`${styles.status} ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}
