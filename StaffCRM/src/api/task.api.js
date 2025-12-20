import api from "./axios";

// Employee
export const getMyTasksAPI = () => api.get("/tasks/my");

// Admin
export const getAllTasksAPI = () => api.get("/tasks/all");

// Create
export const createTaskAPI = (data) => api.post("/tasks", data);

// Update status
export const updateTaskStatusAPI = (id, status) =>
  api.patch(`/tasks/${id}/status`, { status });

// Update task (any field)
export const updateTaskAPI = (id, data) => api.patch(`/tasks/${id}`, data);

// Delete
export const deleteTaskAPI = (id) => api.delete(`/tasks/${id}`);
