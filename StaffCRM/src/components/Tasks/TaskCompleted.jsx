import styles from "./TaskCompleted.module.css";

export default function TaskCompleted({ tasks = [], onStatusChange }) {
  if (!tasks.length) {
    return (
      <div className={styles.completedSection}>
        <h3 className={styles.completedTitle}>Completed Tasks</h3>
        <p className={styles.empty}>No completed tasks found</p>
      </div>
    );
  }

  return (
    <div className={styles.completedSection}>
      <h3 className={styles.completedTitle}>Completed Tasks</h3>

      <div className={styles.completedTableWrapper}>
        <table className={styles.completedTable}>
          <thead>
            <tr>
              <th>Task</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => (
              <tr key={task._id}>
                <td className={styles.name}>{task.name}</td>

                <td>
                  <span
                    className={`${styles.priority} ${styles[task.priority]}`}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                </td>

                <td className={styles.assigned}>
                  {task.assignedTo?.map((u) => u.name).join(", ")}
                </td>

                <td>
                  {task.endDate
                    ? new Date(task.endDate).toLocaleDateString()
                    : "-"}
                </td>

                <td>
                  <select
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
