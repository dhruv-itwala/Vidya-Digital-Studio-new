import TaskStatusBadge from "./TaskStatusBadge";
import { getInitials } from "../../utils/name.util";
import { FiEdit2, FiTrash2, FiClock, FiCalendar } from "react-icons/fi";
import styles from "./Task.module.css";

export default function TaskCard({ task, onStatusChange, onDelete, onEdit }) {
  const canEdit = true;
  const canDelete = true;

  const formattedStart = task.startDate
    ? new Date(task.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "-";
  const formattedEnd = task.endDate
    ? new Date(task.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "-";

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
      
      <div className={styles.meta}>
        <div className={styles.dateInfo}>
          <div className={styles.dateItem}>
            <FiCalendar className={styles.dateIcon} />
            <span>{formattedStart}</span>
          </div>
          <div className={styles.dateItem}>
            <FiClock className={styles.dateIcon} />
            <span>{formattedEnd}</span>
          </div>
        </div>
      </div>
      
      <div className={styles.cardFooter}>
        <div className={styles.assigned}>
          {task.assignedTo?.map((u, index) => (
            <div key={`${u._id}-${index}`} className={styles.userAvatar} title={u.name}>
              {u.profilePicture?.url ? (
                <img src={u.profilePicture.url} alt={u.name} />
              ) : (
                getInitials(u.name)
              )}
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <select
            className={styles.statusSelect}
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
