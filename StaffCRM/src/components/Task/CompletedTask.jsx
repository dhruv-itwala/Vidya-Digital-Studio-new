import { useMemo, useState } from "react";
import styles from "./CompletedTask.module.css";

export default function CompletedTask({ tasks = [], onStatusChange }) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const total = tasks.length;
  const totalPages = Math.ceil(total / rowsPerPage);

  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return tasks.slice(start, start + rowsPerPage);
  }, [tasks, page, rowsPerPage]);

  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  if (!tasks.length) return null;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Completed Tasks</h3>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {paginatedTasks.map((task) => (
              <tr key={task._id}>
                <td>{task.name}</td>

                <td>
                  <span
                    className={`${styles.priority} ${styles[task.priority]}`}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                </td>

                <td>{task.assignedTo.map((u) => u.name).join(", ")}</td>

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

      {/* Pagination */}
      <div className={styles.pagination}>
        <div>
          Rows:
          <select value={rowsPerPage} onChange={handleRowsChange}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </div>

        <div>
          Page {page} of {totalPages}
        </div>

        <div className={styles.controls}>
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ‹
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
