import api from "./axios";

const handleError = (error) => {
  const message =
    error?.response?.data?.message || "Something went wrong. Please try again.";

  throw new Error(message);
};

// ===== TODO =====

export const getTodayTodoAPI = async () => {
  try {
    return await api.get("/todo/today");
  } catch (error) {
    handleError(error);
  }
};

export const getTodoByDateAPI = async (date) => {
  try {
    return await api.get(`/todo/${date}`);
  } catch (error) {
    handleError(error);
  }
};

export const addTodoItemAPI = async (text, date) => {
  try {
    return await api.post("/todo/item", { text, date });
  } catch (error) {
    handleError(error);
  }
};

export const toggleTodoItemAPI = async (id) => {
  try {
    return await api.patch(`/todo/item/${id}`);
  } catch (error) {
    handleError(error);
  }
};

export const deleteTodoItemAPI = async (id) => {
  try {
    return await api.delete(`/todo/item/${id}`);
  } catch (error) {
    handleError(error);
  }
};
