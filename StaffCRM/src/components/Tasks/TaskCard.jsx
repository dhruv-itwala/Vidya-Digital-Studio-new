import { useAuth } from "../../context/AuthContext";
import TaskStatusBadge from "./TaskStatusBadge";
import styles from "./Task.module.css";
import { getDueStatus } from "../../utils/date.util";

export default function TaskCard({ task, onStatusChange, onDelete, onEdit }) {
  const { user } = useAuth();
  const dueStatus = getDueStatus(task.endDate);

  // Everyone can edit
  const canEdit = true;
  const canDelete = true;

  const formattedStart = task.startDate
    ? new Date(task.startDate).toLocaleDateString("en-IN")
    : "-";
  const formattedEnd = task.endDate
    ? new Date(task.endDate).toLocaleDateString("en-IN")
    : "-";

  return (
    <div className={`${styles.card} ${styles[task.priority?.toLowerCase()]}`}>
      <div className={styles.header}>
        <h3 className={styles.taskName}>{task.name}</h3>
        <TaskStatusBadge status={task.status} />
      </div>
      <p className={styles.details}>{task.details}</p>
      <div className={styles.meta}>
        <span>
          Priority: <strong>{task.priority.toUpperCase()}</strong>
        </span>
        <div className={styles.dateInfo}>
          <span>
            Start: <strong>{formattedStart}</strong>
          </span>
          <span>
            Due: <strong>{formattedEnd}</strong>
          </span>
        </div>
      </div>
      <div className={styles.assigned}>
        Assigned to:
        {task.assignedTo.map((u, index) => (
          <span key={`${u._id}-${index}`} className={styles.user}>
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
