import mongoose from "mongoose";

const targetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metric: {
      type: String,
      enum: ["revenue", "leads_closed"],
      default: "revenue",
    },
    targetValue: {
      type: Number,
      required: true,
      min: 0,
    },
    achievedValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    month: {
      type: Number, // 1 - 12
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// A user can only have one target per metric per month per year
targetSchema.index({ user: 1, metric: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("Target", targetSchema);
