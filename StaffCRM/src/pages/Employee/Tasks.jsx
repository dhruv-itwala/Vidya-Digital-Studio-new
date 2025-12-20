import { useEffect, useMemo, useState } from "react";
import {
  getMyTasksAPI,
  updateTaskStatusAPI,
  deleteTaskAPI,
} from "../../api/task.api";
import TaskKanban from "../../components/Task/TaskKanban";
import TaskForm from "../../components/Task/TaskForm";
import { useAuth } from "../../context/AuthContext";
import TaskCompleted from "../../components/Task/TaskCompleted";
import styles from "./Tasks.module.css";

export default function Tasks() {
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
      const res = await getMyTasksAPI();
      setTasks(res.data || []);
    } catch (err) {
      console.error("Failed to load tasks", err);
    }
  };

  const updateStatus = async (id, status) => {
    await updateTaskStatusAPI(id, status);
    loadTasks();
  };

  const removeTask = async (id) => {
    await deleteTaskAPI(id);
    loadTasks();
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === "complete") return false;

      if (t.endDate) {
        const endDate = new Date(t.endDate);
        if (endDate < today) return false;
      }

      const statusMatch = statusFilter === "all" || t.status === statusFilter;
      const priorityMatch =
        priorityFilter === "all" || t.priority === priorityFilter;

      return statusMatch && priorityMatch;
    });
  }, [tasks, statusFilter, priorityFilter, today]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>My Tasks</h2>

        <button
          className={styles.newTaskButton}
          onClick={() => {
            setEditingTask(null);
            setShowForm(true);
          }}
        >
          + New Task
        </button>
      </header>

      <div className={styles.toolbar}>
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
      </div>

      <TaskKanban
        tasks={filteredTasks}
        onStatusChange={updateStatus}
        onDelete={removeTask}
        onEdit={startEdit}
      />

      <TaskCompleted />

      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalClose}
              onClick={() => setShowForm(false)}
            >
              ×
            </button>

            <TaskForm
              users={allEmployees}
              task={editingTask}
              onCreated={() => {
                setShowForm(false);
                loadTasks();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
