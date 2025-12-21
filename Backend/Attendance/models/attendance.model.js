import mongoose from "mongoose";

const breakSchema = new mongoose.Schema(
  {
    in: Date,
    out: Date,
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    in: Date,
    out: Date,
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true }, // IST day
  sessions: [sessionSchema],
  breaks: [breakSchema],
  totalMinutes: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["PRESENT", "HALF_DAY", "ABSENT", "HOLIDAY", "LEAVE"],
    default: "ABSENT",
  },
});

// 🔒 One attendance per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.virtual("istDate").get(function () {
  return this.date.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
});

export default mongoose.model("Attendance", attendanceSchema);
