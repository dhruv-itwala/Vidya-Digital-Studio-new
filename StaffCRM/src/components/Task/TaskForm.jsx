import { useState, useEffect } from "react";
import styles from "./Task.module.css";
import toast from "react-hot-toast";
import { createTaskAPI, updateTaskAPI } from "../../api/task.api";

export default function TaskForm({ users, onCreated, task }) {
  const [form, setForm] = useState({
    name: "",
    details: "",
    assignedTo: [],
    priority: "medium",
    startDate: "",
    endDate: "",
    status: "pending",
  });
  const [dirty, setDirty] = useState(false);

  const employeeUsers = users.filter((u) => u.role !== "admin");

  useEffect(() => {
    if (task) {
      setForm({
        name: task.name,
        details: task.details,
        assignedTo: task.assignedTo.map((u) => u._id),
        priority: task.priority,
        startDate: task.startDate ? task.startDate.slice(0, 10) : "",
        endDate: task.endDate ? task.endDate.slice(0, 10) : "",
        status: task.status,
      });
    }
  }, [task]);

  useEffect(() => {
    window.__TASK_DIRTY__ = dirty;
    return () => (window.__TASK_DIRTY__ = false);
  }, [dirty]);

  const updateField = (key, value) => {
    setDirty(true);
    setForm({ ...form, [key]: value });
  };

  const removeUser = (id) =>
    updateField(
      "assignedTo",
      form.assignedTo.filter((uid) => uid !== id)
    );

  const handleUserSelect = (e) => {
    const selectedIds = Array.from(e.target.selectedOptions, (o) => o.value);
    updateField("assignedTo", selectedIds);
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Task name required");
    if (form.assignedTo.length === 0)
      return toast.error("Assign at least one user");

    try {
      if (task) {
        await updateTaskAPI(task._id, form); // ✅ Use updateTaskAPI
      } else {
        await createTaskAPI(form); // ✅ Use createTaskAPI
      }
      setDirty(false);
      onCreated();
    } catch (err) {
      console.log(err);
      toast.error("Failed to submit task");
    }
  };

  return (
    <div className={styles.form}>
      <input
        placeholder="Task name"
        value={form.name}
        onChange={(e) => updateField("name", e.target.value)}
        className={styles.input}
      />
      <textarea
        placeholder="Task details"
        value={form.details}
        onChange={(e) => updateField("details", e.target.value)}
        className={styles.textarea}
      />

      <div className={styles.userSelect}>
        <select multiple onChange={handleUserSelect}>
          {employeeUsers.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name}
            </option>
          ))}
        </select>

        <div className={styles.chips}>
          {form.assignedTo.map((id) => {
            const user = employeeUsers.find((u) => u._id === id);
            if (!user) return null;
            return (
              <div key={id} className={styles.chip}>
                {user.name}
                <span
                  className={styles.chipRemove}
                  onClick={() => removeUser(id)}
                >
                  ×
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.dateInputs}>
        <label>
          Start Date:{" "}
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
          />
        </label>
        <label>
          End Date:{" "}
          <input
            type="date"
            value={form.endDate}
            min={form.startDate}
            onChange={(e) => updateField("endDate", e.target.value)}
          />
        </label>
      </div>

      <select
        value={form.priority}
        onChange={(e) => updateField("priority", e.target.value)}
        className={styles.select}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <select
        value={form.status}
        onChange={(e) => updateField("status", e.target.value)}
        className={styles.select}
      >
        <option value="pending">Pending</option>
        <option value="started">Started</option>
        <option value="hold">Hold</option>
        <option value="complete">Complete</option>
      </select>

      <button onClick={submit} className={styles.submitButton}>
        {task ? "Update Task" : "Create Task"}
      </button>
    </div>
  );
}
