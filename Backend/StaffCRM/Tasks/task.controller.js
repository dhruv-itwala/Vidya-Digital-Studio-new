import {
  createTaskService,
  getMyTasksService,
  getAllTasksService,
  updateTaskStatusService,
  deleteTaskService,
  updateTaskService,
  getMyCompletedTasksService,
} from "./task.service.js";

export const createTask = async (req, res) => {
  try {
    const task = await createTaskService(req.user, req.body);
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
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await updateTaskService(req.params.id, req.body, req.user);
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    await deleteTaskService(req.params.id, req.user);
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};
