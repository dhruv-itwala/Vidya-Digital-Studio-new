import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
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

    workPoints: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);

// One report per user per day
reportSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("Report", reportSchema);
