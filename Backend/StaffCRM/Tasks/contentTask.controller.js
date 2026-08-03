import AppError from "../utils/AppError.js";
import ContentTask from "./ContentTask.model.js";

export const createContentTask = async (req, res, next) => {
  try {
    const { client, platform, postType, title, publishDate, assignedRoles, notes } = req.body;

    if (!client || !platform || !postType || !title || !publishDate) {
      throw new AppError("Please provide all required fields", 400);
    }

    const newTask = await ContentTask.create({
      client,
      platform,
      postType,
      title,
      publishDate,
      assignedRoles: assignedRoles || [],
      notes,
      createdBy: req.user.id,
    });

    res.status(201).json({
      status: "success",
      data: newTask,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllContentTasks = async (req, res, next) => {
  try {
    const tasks = await ContentTask.find().populate("client", "clientName").populate("createdBy", "name");
    res.status(200).json({
      status: "success",
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getClientContentTasks = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const tasks = await ContentTask.find({ client: clientId }).sort({ publishDate: 1 });
    res.status(200).json({
      status: "success",
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const updateContentTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await ContentTask.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!updated) {
      throw new AppError("Task not found", 404);
    }

    res.status(200).json({
      status: "success",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteContentTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await ContentTask.findByIdAndDelete(id);

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
