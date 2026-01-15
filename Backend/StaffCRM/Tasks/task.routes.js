import express from "express";
import {
  createTask,
  myTasks,
  allTasks,
  updateTaskStatus,
  deleteTask,
  updateTask,
  myCompletedTasks,
} from "./task.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";

const taskRoutes = express.Router();

taskRoutes.use(protect);

taskRoutes.post("/", createTask);
taskRoutes.get("/my", myTasks);
taskRoutes.patch("/:id/status", updateTaskStatus);
taskRoutes.patch("/:id", updateTask);
taskRoutes.delete("/:id", deleteTask);

taskRoutes.get("/my/completed", myCompletedTasks);

// Admin
taskRoutes.get("/all", roleCheck("admin", "hr"), allTasks);

export default taskRoutes;
