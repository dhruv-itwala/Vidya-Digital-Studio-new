import Task from "./task.model.js";
import {
  notifyTaskAssigned,
  notifyTaskCompleted,
} from "../Notifications/notificationEvent.service.js";

// ================= CREATE =================
export const createTaskService = async (user, data) => {
  if (!data.assignedTo || data.assignedTo.length === 0) {
    throw new Error("At least one employee must be assigned");
  }

  const payload = {
    ...data,
    createdBy: {
      user: user.id,
      role: user.role.toLowerCase(),
    },
  };

  if (data.status === "complete") {
    payload.completedAt = data.completedAt || new Date();
  }

  const created = await Task.create(payload);

  const task = await Task.findById(created._id)
    .populate("assignedTo", "name email profilePicture")
    .populate("createdBy.user", "name email profilePicture")
    .lean();

  notifyTaskAssigned(task, user.id);
  return task;
};

// ================= GET MY TASK =================
export const getMyTasksService = async (userId) => {
  return Task.find({
    $or: [{ assignedTo: userId }, { "createdBy.user": userId }],
  })
    .populate("assignedTo", "name email profilePicture")
    .populate("createdBy.user", "name email profilePicture")
    .sort({ createdAt: -1 })
    .lean();
};

// ================= GET COMPLETED TASKS =================
export const getMyCompletedTasksService = async (userId) => {
  return Task.find({
    status: "complete",
    $or: [{ assignedTo: userId }, { "createdBy.user": userId }],
  })
    .populate("assignedTo", "name email profilePicture")
    .populate("createdBy.user", "name email profilePicture")
    .sort({ completedAt: -1, updatedAt: -1 })
    .lean(); // completed recently first
};

// ================= GET ALL TASKS (ADMIN/HR) =================
export const getAllTasksService = async () => {
  return Task.find()
    .populate("assignedTo", "name email profilePicture")
    .populate("createdBy.user", "name email profilePicture")
    .sort({ createdAt: -1 })
    .lean();
};

// ================= UPDATE =================
export const updateTaskService = async (taskId, data, user) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  // Only admin can update admin-created tasks
  if (task.createdBy.role === "admin" && user.role !== "admin") {
    throw new Error("Only admin can update admin-created tasks");
  }

  const updatableFields = [
    "name",
    "details",
    "assignedTo",
    "priority",
    "startDate",
    "endDate",
    "status",
    "completedAt",
    "holdReason",
  ];

  updatableFields.forEach((field) => {
    if (data[field] !== undefined) {
      task[field] = data[field];
    }
  });

  if (data.status !== undefined) {
    if (data.status === "complete") {
      if (!task.completedAt) {
        task.completedAt = new Date();
      }
    } else {
      task.completedAt = null;
    }
  }

  await task.save();

  return Task.findById(task._id)
    .populate("assignedTo", "name email profilePicture")
    .populate("createdBy.user", "name email profilePicture")
    .lean();
};

// ================= UPDATE STATUS =================
export const updateTaskStatusService = async (taskId, status, user = null, holdReason = "") => {
  const updatePayload = { status };
  if (status === "complete" || status === "completed") {
    updatePayload.status = "complete";
    updatePayload.completedAt = new Date();
  } else {
    updatePayload.completedAt = null;
  }

  if (holdReason !== undefined) {
    updatePayload.holdReason = holdReason;
  }

  const task = await Task.findByIdAndUpdate(
    taskId,
    updatePayload,
    { new: true, runValidators: true }
  )
    .populate("assignedTo", "name email profilePicture")
    .populate("createdBy.user", "name email profilePicture")
    .lean();

  if (!task) throw new Error("Task not found");

  if (status === "complete" || status === "completed") {
    notifyTaskCompleted(task, user?.id || user?._id);
  }

  return task;
};


// ================= DELETE =================
export const deleteTaskService = async (taskId, user) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  if (task.createdBy.role === "admin" && user.role !== "admin") {
    throw new Error("Only admin can delete admin-created tasks");
  }

  await task.deleteOne();
};
