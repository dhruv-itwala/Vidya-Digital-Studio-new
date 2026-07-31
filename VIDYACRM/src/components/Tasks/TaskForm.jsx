import { useState, useEffect } from "react";
import styles from "./TaskForm.module.css";
import toast from "react-hot-toast";

export default function TaskForm({ users = [], task, onCancel, onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    details: "",
    assignedTo: [],
    priority: "medium",
    startDate: "",
    endDate: "",
    status: "pending",
  });

  const employeeUsers = users;

  useEffect(() => {
    if (task) {
      setForm({
        name: task.name || "",
        details: task.details || "",
        assignedTo: task.assignedTo?.map((u) => u._id) || [],
        priority: task.priority || "medium",
        startDate: task.startDate ? task.startDate.slice(0, 10) : "",
        endDate: task.endDate ? task.endDate.slice(0, 10) : "",
        status: task.status || "pending",
      });
    }
  }, [task]);

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const removeUser = (id) => {
    updateField(
      "assignedTo",
      form.assignedTo.filter((uid) => uid !== id),
    );
  };

  const handleUserSelect = (e) => {
    const selectedIds = Array.from(e.target.selectedOptions, (o) => o.value);
    updateField("assignedTo", selectedIds);
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Task name required");
    if (form.assignedTo.length === 0) return toast.error("Assign at least one user");
    await onSubmit(form);
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>{task ? "Edit Task" : "Create New Task"}</h2>
      
      <div className={styles.inputGroup}>
        <label>Task Name</label>
        <input
          placeholder="e.g., Finalize Q3 Report"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.inputGroup}>
        <label>Details</label>
        <textarea
          placeholder="Provide more context about this task..."
          value={form.details}
          onChange={(e) => updateField("details", e.target.value)}
          className={styles.textarea}
        />
      </div>

      <div className={styles.inputGroup}>
        <label>Assign To</label>
        <div className={styles.userSelectWrapper}>
          <select multiple value={form.assignedTo} onChange={handleUserSelect} className={styles.multiSelect}>
            {employeeUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
          <div className={styles.chips}>
            {form.assignedTo.length === 0 && <span className={styles.noChips}>No one assigned yet. Select from above.</span>}
            {form.assignedTo.map((id) => {
              const user = employeeUsers.find((u) => u._id === id);
              if (!user) return null;
              return (
                <div key={id} className={styles.chip}>
                  {user.name}
                  <span className={styles.chipRemove} onClick={() => removeUser(id)}>×</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.rowGrid}>
        <div className={styles.inputGroup}>
          <label>Start Date</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>End Date</label>
          <input
            type="date"
            value={form.endDate}
            min={form.startDate}
            onChange={(e) => updateField("endDate", e.target.value)}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.rowGrid}>
        <div className={styles.inputGroup}>
          <label>Priority</label>
          <select value={form.priority} onChange={(e) => updateField("priority", e.target.value)} className={styles.select}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Status</label>
          <select value={form.status} onChange={(e) => updateField("status", e.target.value)} className={styles.select}>
            <option value="pending">Pending</option>
            <option value="started">Started</option>
            <option value="hold">On Hold</option>
            <option value="complete">Complete</option>
          </select>
        </div>
      </div>

      <div className={styles.actionsRow}>
        <button type="button" onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
        <button type="button" onClick={submit} className={styles.submitButton}>
          {task ? "Update Task" : "Create Task"}
        </button>
      </div>
    </div>
  );
}
