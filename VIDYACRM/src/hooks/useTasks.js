import { useEffect, useState, useCallback } from "react";
import {
  createTaskAPI,
  updateTaskAPI,
  updateTaskStatusAPI,
  deleteTaskAPI,
  getAllTasksAPI,
  getMyTasksAPI,
} from "../api/task.api";

export const useTasks = (role) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const api = role === "admin" ? getAllTasksAPI : getMyTasksAPI;

      const res = await api();
      setTasks(res.data || []);
    } catch {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (data) => {
    try {
      const res = await createTaskAPI(data);
      setTasks((prev) => [res.data, ...prev]);
      return { success: true };
    } catch {
      return { success: false, message: "Failed to create task" };
    }
  };

  const updateTask = async (id, data) => {
    try {
      const res = await updateTaskAPI(id, data);
      setTasks((prev) => prev.map((t) => (t._id === id ? res.data : t)));
      return { success: true };
    } catch {
      return { success: false, message: "Failed to update task" };
    }
  };

  const updateStatus = async (id, status, holdReason = "") => {
    let previous;

    setTasks((prev) => {
      previous = prev;
      return prev.map((t) =>
        t._id === id
          ? {
              ...t,
              status,
              holdReason: status === "hold" ? holdReason : t.holdReason,
              completedAt: status === "complete" ? new Date().toISOString() : null,
            }
          : t
      );
    });

    try {
      const res = await updateTaskStatusAPI(id, status, holdReason);
      if (res?.data) {
        setTasks((prev) => prev.map((t) => (t._id === id ? res.data : t)));
      }
      return { success: true };
    } catch {
      setTasks(previous);
      return { success: false, message: "Failed to update status" };
    }
  };

  const deleteTask = async (id) => {
    let previous;

    setTasks((prev) => {
      previous = prev;
      return prev.filter((t) => t._id !== id);
    });

    try {
      await deleteTaskAPI(id);
      return { success: true };
    } catch {
      setTasks(previous);
      return { success: false, message: "Failed to delete task" };
    }
  };

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
  };
};
