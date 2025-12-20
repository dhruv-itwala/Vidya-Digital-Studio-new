import mongoose from "mongoose";

const breakSchema = new mongoose.Schema(
  {
    breakIn: { type: Date, required: true },
    breakOut: { type: Date },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },

    punchIn: { type: Date },
    punchOut: { type: Date },

    breaks: [breakSchema],

    totalMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
