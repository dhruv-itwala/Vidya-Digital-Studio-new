import { useAuth } from "../../context/AuthContext";
import TaskStatusBadge from "./TaskStatusBadge";
import styles from "./Task.module.css";
import { getDueStatus } from "../../utils/date.util";

export default function TaskCard({ task, onStatusChange, onDelete, onEdit }) {
  const { user } = useAuth();
  const dueStatus = getDueStatus(task.endDate);

  // Only admin or task creator can delete/edit
  const canDelete = user.role === "admin" || task.createdBy.user === user._id;
  const canEdit = canDelete;
  const formattedStart = task.startDate
    ? new Date(task.startDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

  const formattedEnd = task.endDate
    ? new Date(task.endDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.taskName}>{task.name}</h3>
        <TaskStatusBadge status={task.status} />
      </div>

      {dueStatus && (
        <span className={`${styles.due} ${styles[dueStatus]}`}>
          {dueStatus === "overdue"
            ? "Overdue"
            : dueStatus === "today"
            ? "Due Today"
            : "Upcoming"}
        </span>
      )}

      <p className={styles.details}>{task.details}</p>

      <div className={styles.meta}>
        <span>
          Priority: <strong>{task.priority.toUpperCase()}</strong>
        </span>
        <span>
          Start: <strong>{formattedStart}</strong>
        </span>
        <span>
          Due: <strong>{formattedEnd}</strong>
        </span>
      </div>

      <div className={styles.assigned}>
        Created by:
        <span className={styles.user}>{task.createdBy.user.name}</span>
      </div>

      <div className={styles.assigned}>
        Assigned to:
        {task.assignedTo.map((u) => (
          <span key={u._id} className={styles.user}>
            {u.name}
          </span>
        ))}
      </div>

      <div className={styles.actions}>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="started">Started</option>
          <option value="hold">Hold</option>
          <option value="complete">Complete</option>
        </select>

        <div className={styles.actionButtons}>
          {canEdit && onEdit && (
            <button className={styles.edit} onClick={() => onEdit(task)}>
              Edit
            </button>
          )}
          {canDelete && (
            <button
              className={styles.delete}
              onClick={() => onDelete(task._id)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
