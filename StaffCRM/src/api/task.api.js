import api from "./axios";

const handleError = (error) => {
  const message =
    error?.response?.data?.message || "Something went wrong. Please try again.";

  throw new Error(message);
};

// ================= EMPLOYEE =================
export const getMyTasksAPI = async () => {
  try {
    return await api.get("/tasks/my");
  } catch (error) {
    handleError(error);
  }
};

export const getMyCompletedTasksAPI = async () => {
  try {
    return await api.get("/tasks/my/completed");
  } catch (error) {
    handleError(error);
  }
};

// ================= ADMIN =================
export const getAllTasksAPI = async () => {
  try {
    return await api.get("/tasks/all");
  } catch (error) {
    handleError(error);
  }
};

// ================= CRUD =================
export const createTaskAPI = async (data) => {
  try {
    return await api.post("/tasks", data);
  } catch (error) {
    handleError(error);
  }
};

export const updateTaskStatusAPI = async (id, status) => {
  try {
    return await api.patch(`/tasks/${id}/status`, { status });
  } catch (error) {
    handleError(error);
  }
};

export const updateTaskAPI = async (id, data) => {
  try {
    return await api.patch(`/tasks/${id}`, data);
  } catch (error) {
    handleError(error);
  }
};

export const deleteTaskAPI = async (id) => {
  try {
    return await api.delete(`/tasks/${id}`);
  } catch (error) {
    handleError(error);
  }
};
