import {
  createTaskService,
  getMyTasksService,
  getAllTasksService,
  updateTaskStatusService,
  deleteTaskService,
  updateTaskService,
  getMyCompletedTasksService,
} from "./task.service.js";
import { logActivity, captureBeforeState } from "../AuditLog/AuditLog.service.js";
import Task from "./task.model.js";

export const createTask = async (req, res) => {
  try {
    const task = await createTaskService(req.user, req.body);
    logActivity({
      req,
      user: req.user,
      category: "System",
      module: "Tasks",
      action: "CREATE",
      entityId: task._id,
      entityName: task.title,
      description: `${req.user.name} created task '${task.title}'`,
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const myTasks = async (req, res) => {
  const tasks = await getMyTasksService(req.user.id);
  res.json(tasks);
};

export const myCompletedTasks = async (req, res) => {
  try {
    const tasks = await getMyCompletedTasksService(req.user.id);
    res.json(tasks);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const allTasks = async (req, res) => {
  const tasks = await getAllTasksService();
  res.json(tasks);
};

export const updateTaskStatus = async (req, res) => {
  try {
    const task = await updateTaskStatusService(req.params.id, req.body.status);
    logActivity({
      req,
      user: req.user,
      category: "System",
      module: "Tasks",
      action: "STATUS_CHANGE",
      entityId: task._id,
      entityName: task.title,
      description: `${req.user.name} changed task '${task.title}' status to '${req.body.status}'`,
    });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const beforeDoc = await captureBeforeState(Task, req.params.id);
    const task = await updateTaskService(req.params.id, req.body, req.user);
    logActivity({
      req,
      user: req.user,
      category: "System",
      module: "Tasks",
      action: "UPDATE",
      entityId: task._id,
      entityName: task.title,
      description: `${req.user.name} updated task '${task.title}'`,
      changes: { before: beforeDoc, after: task }
    });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    await deleteTaskService(req.params.id, req.user);
    logActivity({
      req,
      user: req.user,
      category: "System",
      severity: "WARNING",
      module: "Tasks",
      action: "DELETE",
      entityId: req.params.id,
      description: `${req.user.name} deleted a task`,
    });
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};
