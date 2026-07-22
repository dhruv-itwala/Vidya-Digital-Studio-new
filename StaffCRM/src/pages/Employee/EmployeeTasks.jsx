import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getMyTasksAPI,
  updateTaskStatusAPI,
  deleteTaskAPI,
} from "../../api/task.api";
import TaskKanban from "../../components/Task/TaskKanban";
import TaskForm from "../../components/Task/TaskForm";
import TaskAnalytics from "../../components/Task/TaskAnalytics";
import TaskCompleted from "../../components/Task/TaskCompleted";
import { useAuth } from "../../context/AuthContext";
import styles from "./EmployeeTasks.module.css";

export default function EmployeeTasks({
  showTasks,
  disableTasksAfterPunchOut,
}) {
  const { allEmployees } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  /* ================= LOAD TASKS ================= */

  const loadTasks = useCallback(async () => {
    try {
      const res = await getMyTasksAPI();
      setTasks(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tasks");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (showTasks) loadTasks();
  }, [showTasks, loadTasks]);

  /* ================= ACTIONS ================= */

  const updateStatus = async (id, status) => {
    try {
      await updateTaskStatusAPI(id, status);
      toast.success("Status updated");
      loadTasks();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const removeTask = async (id) => {
    try {
      await deleteTaskAPI(id);
      toast.success("Task deleted");
      loadTasks();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  /* ================= DATE HELPERS ================= */

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isOverdue = (task) => {
    if (!task.endDate) return false;
    if (task.status === "complete") return false;
    return new Date(task.endDate) < today;
  };

  /* ================= ACTIVE TASKS (KANBAN) ================= */

  const activeTasks = useMemo(() => {
    return tasks.filter((t) => {
      // ❌ Never show completed in Kanban
      if (t.status === "complete") return false;

      // Status filter
      if (statusFilter !== "all" && t.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== "all" && t.priority !== priorityFilter)
        return false;

      // ✅ Overdue tasks are ALLOWED
      return true;
    });
  }, [tasks, statusFilter, priorityFilter]);

  /* ================= MODAL ================= */

  const closeModal = () => {
    setShowForm(false);
    setEditingTask(null);
    window.__TASK_DIRTY__ = false;
  };

  if (!showTasks || disableTasksAfterPunchOut) return null;

  /* ================= UI ================= */

  return (
    <div className={styles.container}>
      {/* ===== Header ===== */}
      <header className={styles.header}>
        <h2 className={styles.title}>My Tasks</h2>

        <div className={styles.actionsRow}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="started">Started</option>
            <option value="hold">Hold</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <button
            className={styles.primaryBtn}
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
          >
            + Create Task
          </button>
        </div>
      </header>

      {/* ===== Analytics ===== */}
      <TaskAnalytics tasks={tasks} />

      {/* ===== Kanban (Active + Overdue) ===== */}
      <TaskKanban
        tasks={activeTasks}
        isOverdue={isOverdue}
        onStatusChange={updateStatus}
        onDelete={removeTask}
        onEdit={startEdit}
      />

      {/* ===== Completed Tasks ===== */}
      <TaskCompleted />

      {/* ===== Task Form Modal ===== */}
      {showForm && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            if (
              !window.__TASK_DIRTY__ ||
              window.confirm("You have unsaved changes. Discard them?")
            ) {
              closeModal();
            }
          }}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <TaskForm
              users={allEmployees}
              task={editingTask}
              onCreated={() => {
                toast.success(editingTask ? "Task updated" : "Task created");
                closeModal();
                loadTasks();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
