import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getTodayTodo,
  getTodoByDate,
  addTodoItem,
  toggleTodoItem,
  deleteTodoItem,
} from "./todo.controller.js";

const todoRoutes = express.Router();

todoRoutes.use(protect);

todoRoutes.get("/today", getTodayTodo);
todoRoutes.get("/:date", getTodoByDate);

todoRoutes.post("/item", addTodoItem);
todoRoutes.patch("/item/:itemId", toggleTodoItem);
todoRoutes.delete("/item/:itemId", deleteTodoItem);

export default todoRoutes;
