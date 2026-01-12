import { useEffect, useState } from "react";
import {
  getMyCompletedTasksAPI,
  updateTaskStatusAPI,
} from "../../api/task.api";
import styles from "./Task.module.css";
import Loader from "../Loader/Loader";

export default function TaskCompleted() {
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getMyCompletedTasksAPI();
      const completedTasks = res.data.filter((t) => t.status === "complete");

      // res.data.forEach((t) => console.log(t.status));

      setTasks(completedTasks);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await updateTaskStatusAPI(id, status);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    // Status filter
    if (statusFilter && task.status !== statusFilter) return false;

    // Priority filter
    if (priorityFilter && task.priority !== priorityFilter) return false;

    // Date range filter
    if (fromDate || toDate) {
      const taskDate = task.endDate ? new Date(task.endDate) : null;
      if (!taskDate) return false;

      if (fromDate && taskDate < new Date(fromDate)) return false;
      if (toDate && taskDate > new Date(toDate)) return false;
    }

    return true;
  });

  if (loading) return <Loader />;
  if (error) return <p className={styles.error}>{error}</p>;
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Completed & Past Tasks</h2>
        <button
          className={styles.filterToggle}
          onClick={() => setShowFilters((p) => !p)}
        >
          Filters
        </button>
      </div>
      {showFilters && (
        <div className={styles.filterSection}>
          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          {/* Date Range */}
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />

          <button
            className={styles.clear}
            onClick={() => {
              setStatusFilter("");
              setPriorityFilter("");
              setFromDate("");
              setToDate("");
            }}
          >
            Clear
          </button>
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Task Name</th>
            <th>Priority</th>
            <th>Assigned To</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {filteredTasks.length === 0 ? (
            <tr>
              <td colSpan="5" className={styles.empty}>
                No completed tasks found
              </td>
            </tr>
          ) : (
            filteredTasks.map((task) => (
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
                  {task.assignedTo.map((u) => u.name).join(", ")}
                </td>

                <td>
                  {task.endDate
                    ? new Date(task.endDate).toLocaleDateString()
                    : "-"}
                </td>

                <td>
                  <select
                    value={task.status}
                    onChange={(e) => changeStatus(task._id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="started">Started</option>
                    <option value="hold">Hold</option>
                    <option value="complete">Complete</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ===== Mobile Cards ===== */}
      <div className={styles.mobileList}>
        {filteredTasks.length === 0 ? (
          <p className={styles.empty}>No completed tasks found</p>
        ) : (
          filteredTasks.map((task) => (
            <div key={task._id} className={styles.card}>
              <div className={styles.header}>
                <span className={styles.taskName}>{task.name}</span>
                <span className={`${styles.status} ${styles[task.status]}`}>
                  {task.status.toUpperCase()}
                </span>
              </div>

              <div className={styles.meta}>
                <span>
                  <strong>Priority:</strong>{" "}
                  <span
                    className={`${styles.priority} ${styles[task.priority]}`}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                </span>

                <span>
                  <strong>Due:</strong>{" "}
                  {task.endDate
                    ? new Date(task.endDate).toLocaleDateString()
                    : "-"}
                </span>
              </div>

              <div className={styles.assigned}>
                <strong>Assigned:</strong>{" "}
                {task.assignedTo.map((u) => u.name).join(", ")}
              </div>

              <div className={styles.actions}>
                <select
                  value={task.status}
                  onChange={(e) => changeStatus(task._id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="started">Started</option>
                  <option value="hold">Hold</option>
                  <option value="complete">Complete</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
