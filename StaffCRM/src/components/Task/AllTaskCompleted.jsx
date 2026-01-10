import { useEffect, useMemo, useState } from "react";
import { getAllTasksAPI, updateTaskStatusAPI } from "../../api/task.api";
import styles from "./AllTaskCompleted.module.css";
import Loader from "../Loader/Loader";
import { IoFilterOutline } from "react-icons/io5";

export default function AllTaskCompleted() {
  const [tasks, setTasks] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getAllTasksAPI();
      setTasks(res.data.filter((t) => ["complete", "hold"].includes(t.status)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (id, status) => {
    await updateTaskStatusAPI(id, status);
    load();
  };

  const allEmployees = useMemo(() => {
    return Array.from(
      new Map(
        tasks.flatMap((t) => t.assignedTo).map((u) => [u._id, u])
      ).values()
    );
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (
        employeeFilter.length &&
        !task.assignedTo.some((u) => employeeFilter.includes(u._id))
      )
        return false;

      if (fromDate || toDate) {
        const d = new Date(task.endDate);
        if (fromDate && d < new Date(fromDate)) return false;
        if (toDate && d > new Date(toDate)) return false;
      }

      return true;
    });
  }, [tasks, employeeFilter, fromDate, toDate]);

  const total = filteredTasks.length;
  const start = (page - 1) * rowsPerPage;
  const paginated = filteredTasks.slice(start, start + rowsPerPage);
  const pages = Math.ceil(total / rowsPerPage);

  if (loading) return <Loader />;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Completed & Past Tasks</h2>
        <button
          className={styles.filterToggle}
          onClick={() => setShowFilters((p) => !p)}
        >
          <IoFilterOutline /> Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className={styles.filterSection}>
          {/* Assigned Pills */}
          <div className={styles.filterGroup}>
            <div className={styles.pillContainer}>
              {allEmployees.map((e) => (
                <button
                  key={e._id}
                  className={`${styles.pill} ${
                    employeeFilter.includes(e._id) ? styles.active : ""
                  }`}
                  onClick={() =>
                    setEmployeeFilter((p) =>
                      p.includes(e._id)
                        ? p.filter((i) => i !== e._id)
                        : [...p, e._id]
                    )
                  }
                >
                  {e.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date Filters */}
          <div className={styles.filterGroup}>
            <div className={styles.dateRow}>
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
                  setEmployeeFilter([]);
                  setFromDate("");
                  setToDate("");
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrapper}>
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
            {paginated.map((t) => (
              <tr key={t._id}>
                <td>{t.name}</td>
                <td>
                  <span className={`${styles.priority} ${styles[t.priority]}`}>
                    {t.priority.toUpperCase()}
                  </span>
                </td>
                <td>{t.assignedTo.map((u) => u.name).join(", ")}</td>
                <td>{new Date(t.endDate).toLocaleDateString()}</td>
                <td>
                  <select
                    value={t.status}
                    onChange={(e) => changeStatus(t._id, e.target.value)}
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

          <tfoot>
            <tr>
              <td colSpan="5">
                <div className={styles.pagination}>
                  <div>
                    <select
                      className={styles.rowsSelect}
                      value={rowsPerPage}
                      onChange={(e) => setRowsPerPage(+e.target.value)}
                    >
                      <option>5</option>
                      <option>10</option>
                      <option>25</option>
                    </select>
                  </div>

                  <div>
                    {start + 1}-{Math.min(start + rowsPerPage, total)} of{" "}
                    {total}
                  </div>

                  <div className={styles.pageControls}>
                    <button
                      className={styles.filterToggle}
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      ‹
                    </button>
                    <button
                      className={styles.filterToggle}
                      disabled={page === pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      ›
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
