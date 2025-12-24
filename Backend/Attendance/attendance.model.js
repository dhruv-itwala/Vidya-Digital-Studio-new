// Backend/Attendance/attendance.model.js
import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true }, // IST day (UTC stored)
    status: {
      type: String,
      enum: ["PRESENT", "HALF_DAY", "ABSENT", "WFH", "HOLIDAY", "LEAVE"],
      default: "ABSENT",
    },
    source: {
      type: String,
      enum: ["SYSTEM", "HR", "ADMIN"],
      default: "SYSTEM",
    },
    remarks: String,
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
