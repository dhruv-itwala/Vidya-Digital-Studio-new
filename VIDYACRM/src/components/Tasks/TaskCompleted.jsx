import { getInitials } from "../../utils/name.util";
import styles from "./TaskCompleted.module.css";

export default function TaskCompleted({ tasks = [], onStatusChange }) {
  if (!tasks.length) {
    return (
      <div className={styles.completedSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.completedTitle}>Completed Tasks</h3>
        </div>
        <div className={styles.emptyState}>
          <p>No completed tasks found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.completedSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.completedTitle}>Completed Tasks</h3>
        <span className={styles.taskCount}>{tasks.length}</span>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Task Details</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task._id} className={styles.tableRow}>
                <td>
                  <div className={styles.taskInfo}>
                    <span className={styles.taskName}>{task.name}</span>
                    {task.details && <span className={styles.taskDesc}>{task.details.substring(0, 40)}...</span>}
                  </div>
                </td>
                <td>
                  <span className={`${styles.priorityBadge} ${styles[task.priority.toLowerCase()]}`}>
                    {task.priority.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className={styles.assignedGroup}>
                    {task.assignedTo?.map((u, idx) => (
                      <div key={idx} className={styles.userAvatar} title={u.name}>
                        {u.profilePicture?.url ? (
                          <img src={u.profilePicture.url} alt={u.name} />
                        ) : (
                          getInitials(u.name)
                        )}
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={styles.dateText}>
                    {task.endDate
                      ? new Date(task.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "-"}
                  </span>
                </td>
                <td>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
