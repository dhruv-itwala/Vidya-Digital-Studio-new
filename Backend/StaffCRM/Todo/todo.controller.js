import {
  getTodoByDateService,
  addTodoItemService,
  toggleTodoItemService,
  deleteTodoItemService,
} from "./todo.service.js";

const today = () => new Date().toISOString().split("T")[0];

export const getTodayTodo = async (req, res) => {
  const todo = await getTodoByDateService(req.user.id, today());
  res.json(todo);
};

export const getTodoByDate = async (req, res) => {
  const todo = await getTodoByDateService(req.user.id, req.params.date);
  res.json(todo);
};

export const addTodoItem = async (req, res) => {
  try {
    const todo = await addTodoItemService(
      req.user.id,
      req.body.date || today(),
      req.body.text
    );
    res.json(todo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const toggleTodoItem = async (req, res) => {
  try {
    const todo = await toggleTodoItemService(req.user.id, req.params.itemId);
    res.json(todo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteTodoItem = async (req, res) => {
  try {
    const todo = await deleteTodoItemService(req.user.id, req.params.itemId);
    res.json(todo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
