import TaskStatusBadge from "./TaskStatusBadge";
import { formatToIST } from "../../utils/date.util";
import styles from "./Task.module.css";

export default function TaskCard({ task, onStatusChange, onDelete, onEdit }) {
  // Everyone can edit
  const canEdit = true;
  const canDelete = true;

  const formattedStart = formatToIST(task.startDate);
  const formattedEnd = formatToIST(task.endDate);

  const handleStatusChange = (e) => {
    onStatusChange(task._id, e.target.value);
  };

  return (
    <div className={`${styles.card} ${styles[task.priority?.toLowerCase()]}`}>
      <div className={styles.header}>
        <h3 className={styles.taskName}>{task.name}</h3>
        <TaskStatusBadge status={task.status} />
      </div>
      <p className={styles.details}>{task.details}</p>

      {task.status === "hold" && task.holdReason && (
        <div style={{ background: "#fffbeb", color: "#b45309", padding: "6px 10px", borderRadius: "6px", fontSize: "0.8rem", margin: "6px 0" }}>
          <strong>Hold Reason:</strong> {task.holdReason}
        </div>
      )}

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
        {task.assignedTo?.map((u, index) => {
          const userName = typeof u === "object" ? u.name : "Employee";
          const uId = typeof u === "object" ? u._id : u;
          return (
            <span key={`${uId}-${index}`} className={styles.user}>
              {userName}
            </span>
          );
        })}
      </div>
      <div className={styles.actions}>
        <select
          value={task.status}
          onChange={handleStatusChange}
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
