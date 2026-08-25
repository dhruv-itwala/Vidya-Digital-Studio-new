import TaskStatusBadge from "./TaskStatusBadge";
import { getInitials } from "../../utils/name.util";
import { formatToIST, isTaskOverdue } from "../../utils/date.util";
import { FiEdit2, FiTrash2, FiClock, FiCalendar, FiAlertCircle, FiPauseCircle } from "react-icons/fi";
import styles from "./Task.module.css";

export default function TaskCard({ task, onStatusChange, onDelete, onEdit }) {
  const canEdit = true;
  const canDelete = true;

  const formattedStart = formatToIST(task.startDate);
  const formattedEnd = formatToIST(task.endDate);
  const overdue = isTaskOverdue(task.endDate, task.status);

  const handleStatusChange = (e) => {
    onStatusChange(task._id, e.target.value);
  };

  return (
    <div className={`${styles.card} ${styles[task.priority?.toLowerCase()]}`}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.taskName}>{task.name}</h3>
          <span className={`${styles.priorityBadge} ${styles[task.priority?.toLowerCase() + "Badge"]}`}>
            {task.priority}
          </span>
        </div>
      </div>

      <p className={styles.details}>{task.details}</p>

      {task.status === "hold" && task.holdReason && (
        <div className={styles.holdReasonBadge}>
          <FiPauseCircle className={styles.holdIcon} />
          <span>
            <strong>Hold Reason:</strong> {task.holdReason}
          </span>
        </div>
      )}

      <div className={styles.meta}>
        <div className={styles.dateInfo}>
          <div className={styles.dateItem} title={`Start: ${formattedStart}`}>
            <FiCalendar className={styles.dateIcon} />
            <span>{formattedStart}</span>
          </div>
          <div className={`${styles.dateItem} ${overdue ? styles.overdueDate : ""}`} title={`Due: ${formattedEnd}`}>
            <FiClock className={styles.dateIcon} />
            <span>{formattedEnd}</span>
            {overdue && <span className={styles.overdueBadge}>Overdue</span>}
          </div>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.assigned}>
          {task.assignedTo?.map((u, index) => {
            const userName = typeof u === "object" ? u.name : "Employee";
            const avatarUrl = typeof u === "object" ? u.profilePicture?.url : null;
            const uId = typeof u === "object" ? u._id : u;

            return (
              <div key={`${uId}-${index}`} className={styles.userAvatar} title={userName}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} />
                ) : (
                  getInitials(userName)
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.actions}>
          <select
            className={styles.statusSelect}
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
              <button className={styles.iconBtn} onClick={() => onEdit(task)} title="Edit">
                <FiEdit2 />
              </button>
            )}
            {canDelete && (
              <button
                className={`${styles.iconBtn} ${styles.deleteBtn}`}
                onClick={() => onDelete(task._id)}
                title="Delete"
              >
                <FiTrash2 />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
