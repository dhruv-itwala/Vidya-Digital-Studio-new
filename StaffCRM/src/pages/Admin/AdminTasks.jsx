import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  getAllTasksAPI,
  updateTaskStatusAPI,
  deleteTaskAPI,
  createTaskAPI,
  updateTaskAPI,
} from "../../api/task.api";
import TaskKanban from "../../components/Task/TaskKanban";
import TaskForm from "../../components/Task/TaskForm";
import TaskAnalytics from "../../components/Task/TaskAnalytics";
import { useAuth } from "../../context/AuthContext";
import styles from "./AdminTasks.module.css";
import AllTaskCompleted from "../../components/Task/AllTaskCompleted";

export default function AdminTasks() {
  const { allEmployees } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await getAllTasksAPI();
      setTasks(res.data || []);
    } catch (err) {
      console.error("Failed to load tasks", err);
      toast.error("Failed to load tasks");
    }
  };

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

  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((t) => {
      const statusMatch = statusFilter === "all" || t.status === statusFilter;
      const priorityMatch =
        priorityFilter === "all" || t.priority === priorityFilter;

      if (!statusMatch || !priorityMatch) return false;

      // ❌ hide completed tasks whose END DATE is passed
      if (t.status === "complete" && t.endDate) {
        const endDate = new Date(t.endDate);
        endDate.setHours(0, 0, 0, 0);

        if (endDate < today) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, statusFilter, priorityFilter]);

  const closeModal = () => {
    setShowForm(false);
    setEditingTask(null);
    window.__TASK_DIRTY__ = false;
  };

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>All Tasks</h2>
          <div className={styles.actionsRow}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="started">Started</option>
              <option value="hold">Hold</option>
              <option value="complete">Complete</option>
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

        <TaskAnalytics tasks={tasks} />

        <TaskKanban
          tasks={filteredTasks}
          onStatusChange={updateStatus}
          onDelete={removeTask}
          onEdit={startEdit}
        />

        <AllTaskCompleted />

        {showForm && (
          <div
            className={styles.modalOverlay}
            onClick={() => {
              if (
                !window.__TASK_DIRTY__ ||
                window.confirm("You have unsaved changes. Discard them?")
              )
                closeModal();
            }}
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.modalClose} onClick={closeModal}>
                ×
              </button>
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
    </div>
  );
}
