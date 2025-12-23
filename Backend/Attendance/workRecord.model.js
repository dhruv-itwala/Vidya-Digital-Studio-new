import mongoose from "mongoose";

const breakSchema = new mongoose.Schema(
  { in: Date, out: Date },
  { _id: false }
);

const workRecordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true }, // IST day (UTC stored)

    punchIn: Date,
    punchOut: Date,

    breaks: [breakSchema],

    totalWorkMinutes: { type: Number, default: 0 },
    totalBreakMinutes: { type: Number, default: 0 },
    netWorkMinutes: { type: Number, default: 0 },

    autoClosed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

workRecordSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("WorkRecord", workRecordSchema);
