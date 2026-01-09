import { useEffect, useState } from "react";
import { getAllTasksAPI, updateTaskStatusAPI } from "../../api/task.api";
import styles from "./Task.module.css";
import Loader from "../Loader/Loader";
import { IoFilterOutline } from "react-icons/io5";

export default function AllTaskCompleted() {
  const [tasks, setTasks] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const allEmployees = Array.from(
    new Map(tasks.flatMap((t) => t.assignedTo).map((u) => [u._id, u])).values()
  );

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getAllTasksAPI();
      const completedTasks = res.data.filter(
        (t) => t.status === "complete" || t.status === "hold"
      );
      res.data.forEach((t) => console.log(t.status));

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
    // employee filter
    if (
      employeeFilter.length > 0 &&
      !task.assignedTo.some((u) => employeeFilter.includes(u._id))
    ) {
      return false;
    }

    // date filter
    if (fromDate || toDate) {
      const taskDate = task.endDate ? new Date(task.endDate) : null;

      if (fromDate && taskDate < new Date(fromDate)) return false;
      if (toDate && taskDate > new Date(toDate)) return false;
    }

    return true;
  });

  if (loading) return <Loader />;
  if (error) return <p className={styles.error}>{error}</p>;
  return (
    <div className={styles.container}>
      {/* ================= HEADER ================= */}
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Completed & Past Tasks</h2>

        <button
          className={styles.filterToggle}
          onClick={() => setShowFilters((p) => !p)}
        >
          <IoFilterOutline />
          Filters
        </button>
      </div>

      {/* ================= FILTER SECTION ================= */}
      {showFilters && (
        <div className={styles.filterSection}>
          {/* ===== Assigned To ===== */}
          <div className={styles.filterBlock}>
            <span className={styles.filterLabel}>Assigned To</span>

            <div className={styles.pillContainer}>
              {allEmployees.map((emp) => (
                <button
                  key={emp._id}
                  className={`${styles.pill} ${
                    employeeFilter.includes(emp._id) ? styles.active : ""
                  }`}
                  onClick={() =>
                    setEmployeeFilter((prev) =>
                      prev.includes(emp._id)
                        ? prev.filter((id) => id !== emp._id)
                        : [...prev, emp._id]
                    )
                  }
                >
                  {emp.name}
                </button>
              ))}
            </div>
          </div>

          {/* ===== Date Range ===== */}
          <div className={styles.filterBlock}>
            <span className={styles.filterLabel}>Date Range</span>

            <div className={styles.dateRow}>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <span className={styles.to}>→</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
              <button
                className={styles.clear}
                onClick={() => {
                  setEmployeeFilter([]);
                  setFromDate("");
                  setToDate("");
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
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
      {/* Mobile View */}
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
                <div>
                  <strong>Priority:</strong>{" "}
                  <span
                    className={`${styles.priority} ${styles[task.priority]}`}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                </div>

                <div>
                  <strong>Assigned:</strong>{" "}
                  {task.assignedTo.map((u) => u.name).join(", ")}
                </div>

                <div>
                  <strong>End Date:</strong>{" "}
                  {task.endDate
                    ? new Date(task.endDate).toLocaleDateString()
                    : "-"}
                </div>
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
