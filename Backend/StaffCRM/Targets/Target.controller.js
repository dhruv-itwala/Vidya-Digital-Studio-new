import Target from "./Target.model.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @route   GET /api/targets/my-targets
export const getMyTargets = asyncHandler(async (req, res) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const targets = await Target.find({
    user: req.user._id,
    month: currentMonth,
    year: currentYear,
  });

  res.status(200).json({ success: true, targets });
});

// @route   POST /api/targets
export const setTarget = asyncHandler(async (req, res) => {
  const { user, metric, targetValue, month, year } = req.body;

  if (!user || !targetValue || !month || !year) {
    throw new AppError("Missing required fields", 400);
  }

  // Update or create
  const target = await Target.findOneAndUpdate(
    { user, metric: metric || "revenue", month, year },
    { targetValue },
    { new: true, upsert: true }
  );

  res.status(200).json({ success: true, target });
});

// @route   GET /api/targets/:userId
export const getUserTargets = asyncHandler(async (req, res) => {
  const targets = await Target.find({ user: req.params.userId }).sort({ year: -1, month: -1 });
  res.status(200).json({ success: true, targets });
});
