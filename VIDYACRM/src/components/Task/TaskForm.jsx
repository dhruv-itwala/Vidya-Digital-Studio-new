import { useState, useEffect } from "react";
import styles from "./TaskForm.module.css";
import toast from "react-hot-toast";
import { createTaskAPI, updateTaskAPI } from "../../api/task.api";
import { toLocalDatetimeInput, fromLocalDatetimeInput } from "../../utils/date.util";

export default function TaskForm({ users, task, onCancel, onCreated }) {
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

  const employeeUsers = users || [];

  useEffect(() => {
    if (task) {
      setForm({
        name: task.name || "",
        details: task.details || "",
        assignedTo: task.assignedTo?.map((u) => (typeof u === "object" ? u._id : u)) || [],
        priority: task.priority || "medium",
        startDate: toLocalDatetimeInput(task.startDate),
        endDate: toLocalDatetimeInput(task.endDate),
        status: task.status || "pending",
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
      form.assignedTo.filter((uid) => uid !== id),
    );

  const handleUserSelect = (e) => {
    const selectedIds = Array.from(e.target.selectedOptions, (o) => o.value);
    updateField("assignedTo", selectedIds);
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Task name required");
    if (form.assignedTo.length === 0)
      return toast.error("Assign at least one user");

    if (form.status === "hold" && !form.holdReason?.trim()) {
      return toast.error("Please provide a reason why this task is on hold");
    }

    if (form.startDate && form.endDate) {
      if (new Date(form.startDate) > new Date(form.endDate)) {
        return toast.error("Start Date & Time cannot be later than Due Date & Time");
      }
    }

    const payload = {
      ...form,
      startDate: fromLocalDatetimeInput(form.startDate),
      endDate: fromLocalDatetimeInput(form.endDate),
    };

    try {
      if (task) {
        await updateTaskAPI(task._id, payload);
      } else {
        await createTaskAPI(payload);
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
        <select multiple onChange={handleUserSelect} value={form.assignedTo}>
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
          Start Date & Time:{" "}
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
          />
        </label>
        <label>
          Due Date & Time:{" "}
          <input
            type="datetime-local"
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

      {form.status === "hold" && (
        <textarea
          placeholder="Reason for putting this task on hold (Required)..."
          value={form.holdReason || ""}
          onChange={(e) => updateField("holdReason", e.target.value)}
          className={styles.textarea}
          style={{ borderColor: "#fde68a", background: "#fffbeb" }}
        />
      )}

      <div className={styles.actionsRow}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
        >
          Cancel
        </button>

        <button type="button" onClick={submit} className={styles.submitButton}>
          {task ? "Update Task" : "Create Task"}
        </button>
      </div>
    </div>
  );
}
