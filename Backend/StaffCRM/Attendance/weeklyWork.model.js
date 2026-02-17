// Backend/StaffCRM/Attendance/weeklyWork.model.js
import mongoose from "mongoose";

const weeklyWorkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    weekStart: { type: Date, required: true }, // Monday IST stored in UTC
    weekEnd: { type: Date, required: true },

    totalMinutes: { type: Number, default: 0 },
    requiredMinutes: { type: Number, default: 48 * 60 },

    status: {
      type: String,
      enum: ["IN_PROGRESS", "COMPLETED", "DEFICIT"],
      default: "IN_PROGRESS",
    },
  },
  { timestamps: true },
);

weeklyWorkSchema.index({ user: 1, weekStart: 1 }, { unique: true });

export default mongoose.model("WeeklyWork", weeklyWorkSchema);
