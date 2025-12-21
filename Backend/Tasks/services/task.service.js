import Task from "../models/task.model.js";

export const createTaskService = async (user, data) => {
  if (!data.assignedTo || data.assignedTo.length === 0) {
    throw new Error("At least one employee must be assigned");
  }

  return Task.create({
    ...data,
    createdBy: {
      user: user.id,
      role: user.role.toLowerCase(),
    },
  });
};
export const getMyTasksService = async (userId) => {
  return Task.find({
    $or: [{ assignedTo: userId }, { "createdBy.user": userId }],
  })
    .populate("assignedTo", "name email")
    .populate("createdBy.user", "name email")
    .sort({ createdAt: -1 });
};

export const getAllTasksService = async () => {
  return Task.find()
    .populate("assignedTo", "name email")
    .populate("createdBy.user", "name email")
    .sort({ createdAt: -1 });
};

export const updateTaskService = async (taskId, data, user) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  // Employee cannot update admin-created task except if assigned
  if (user.role === "employee" && task.createdBy.role === "admin") {
    throw new Error("You cannot update admin-created tasks");
  }

  // Only allow updating certain fields
  const updatableFields = [
    "name",
    "details",
    "assignedTo",
    "priority",
    "startDate",
    "endDate",
    "status",
  ];
  updatableFields.forEach((field) => {
    if (data[field] !== undefined) {
      task[field] = data[field];
    }
  });

  await task.save();
  return task;
};

export const updateTaskStatusService = async (taskId, status) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  task.status = status;
  await task.save();

  return task;
};

export const deleteTaskService = async (taskId, user) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  // Employee cannot delete admin-created task
  if (
    (user.role === "employee" && task.createdBy.role === "admin") ||
    (user.role === "hr" && task.createdBy.role === "admin")
  ) {
    throw new Error("You cannot delete admin-created tasks");
  }

  await task.deleteOne();
};
