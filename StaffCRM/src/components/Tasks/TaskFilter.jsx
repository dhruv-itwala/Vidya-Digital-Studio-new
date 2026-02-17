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

  const employeeUsers = users.filter((u) => u.role !== "admin");

  const handleEmployeeChange = (e) => {
    const selected = Array.from(
      e.target.selectedOptions,
      (option) => option.value,
    );
    setEmployees(selected);
  };

  return (
    <div className={styles.container}>
      {/* Status Filter */}
      <div className={styles.group}>
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="started">Started</option>
          <option value="hold">Hold</option>
          <option value="complete">Complete</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div className={styles.group}>
        <label>Priority</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="all">All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Employee Filter (Admin Only) */}
      {role === "admin" && (
        <div className={styles.group}>
          <label>Assigned To</label>
          <select multiple value={employees} onChange={handleEmployeeChange}>
            {employeeUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Reset Button */}
      <div className={styles.actions}>
        <button type="button" className={styles.reset} onClick={resetFilters}>
          Reset
        </button>
      </div>
    </div>
  );
}
