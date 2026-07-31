import { FiFilter, FiRefreshCw } from "react-icons/fi";
import styles from "./TaskFilter.module.css";

export default function TaskFilter({
  role,
  users = [],
  filters,
  setStatus,
  setPriority,
  setEmployees,
  resetFilters,
}) {
  const { status, priority, employees } = filters;
  const employeeUsers = users;

  const handleEmployeeChange = (e) => {
    const selected = Array.from(
      e.target.selectedOptions,
      (option) => option.value,
    );
    setEmployees(selected);
  };

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterHeader}>
        <FiFilter className={styles.filterIcon} />
        <span>Filter Tasks</span>
      </div>
      
      <div className={styles.filterControls}>
        {/* Status Filter */}
        <div className={styles.filterGroup}>
          <label>Status</label>
          <select className={styles.selectInput} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="started">Started</option>
            <option value="hold">On Hold</option>
            <option value="complete">Complete</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className={styles.filterGroup}>
          <label>Priority</label>
          <select className={styles.selectInput} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Employee Filter (Admin Only) */}
        {role === "admin" && (
          <div className={styles.filterGroup}>
            <label>Assigned To</label>
            <select className={`${styles.selectInput} ${styles.multiSelect}`} multiple value={employees} onChange={handleEmployeeChange}>
              {employeeUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Reset Button */}
      <button type="button" className={styles.resetBtn} onClick={resetFilters}>
        <FiRefreshCw className={styles.resetIcon} />
        Reset
      </button>
    </div>
  );
}
