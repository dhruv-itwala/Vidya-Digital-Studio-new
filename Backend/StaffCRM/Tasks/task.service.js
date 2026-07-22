import Task from "./task.model.js";

// ================= CREATE =================
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

// ================= GET MY TASK =================
export const getMyTasksService = async (userId) => {
  return Task.find({
    $or: [{ assignedTo: userId }, { "createdBy.user": userId }],
  })
    .populate("assignedTo", "name email")
    .populate("createdBy.user", "name email")
    .sort({ createdAt: -1 })
    .lean();
};

// ================= GET COMPLETED TASKS =================
export const getMyCompletedTasksService = async (userId) => {
  return Task.find({
    status: "complete",
    $or: [{ assignedTo: userId }, { "createdBy.user": userId }],
  })
    .populate("assignedTo", "name email")
    .populate("createdBy.user", "name email")
    .sort({ updatedAt: -1 })
    .lean(); // completed recently first
};

// ================= GET ALL TASKS (ADMIN/HR) =================
export const getAllTasksService = async () => {
  return Task.find()
    .populate("assignedTo", "name email")
    .populate("createdBy.user", "name email")
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
  ];

  updatableFields.forEach((field) => {
    if (data[field] !== undefined) {
      task[field] = data[field];
    }
  });

  await task.save();
  return task;
};

// ================= UPDATE STATUS =================
export const updateTaskStatusService = async (taskId, status) => {
  const task = await Task.findByIdAndUpdate(
    taskId,
    { status },
    { new: true, runValidators: true }
  );
  if (!task) throw new Error("Task not found");

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
