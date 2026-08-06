import Announcement from "./Announcement.model.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getISTDayRange } from "../utils/date.utils.js";
import { notifyAnnouncement } from "../Notifications/notificationEvent.service.js";

// @route   GET /api/announcements
// @desc    Get all active announcements
export const getAnnouncements = asyncHandler(async (req, res) => {
  const now = new Date();
  
  // Find announcements that don't have an expiry date OR haven't expired yet
  const announcements = await Announcement.find({
    $and: [
      { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }] },
      { $or: [{ targetUsers: { $exists: false } }, { targetUsers: { $size: 0 } }, { targetUsers: req.user._id }] }
    ]
  })
    .populate("author", "name profilePicture")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, announcements });
});

// @route   POST /api/announcements
// @desc    Create a new announcement
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, type, expiresAt, targetUsers } = req.body;

  if (!title || !message) {
    throw new AppError("Title and message are required", 400);
  }

  let finalExpiresAt = expiresAt;
  if (expiresAt) {
    // If the user picked a date, make it expire at the very end of that day in IST
    const { end } = getISTDayRange(expiresAt);
    finalExpiresAt = new Date(end.getTime() - 1);
  }

  const announcement = await Announcement.create({
    title,
    message,
    type,
    author: req.user._id,
    expiresAt: finalExpiresAt,
    targetUsers: targetUsers || [],
  });

  // Dispatch push notification
  await notifyAnnouncement(announcement, targetUsers);

  res.status(201).json({ success: true, announcement });
});

// @route   DELETE /api/announcements/:id
// @desc    Delete an announcement
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    throw new AppError("Announcement not found", 404);
  }

  await announcement.deleteOne();
  res.status(200).json({ success: true, message: "Announcement deleted" });
});
