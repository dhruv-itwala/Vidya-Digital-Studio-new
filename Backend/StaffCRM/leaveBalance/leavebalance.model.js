import mongoose from "mongoose";

const leaveHistorySchema = new mongoose.Schema({
  date: {
    type: Date, // stored in UTC
    required: true,
  },

  type: {
    type: String,
    enum: ["CASUAL", "SICK", "HALF_DAY"],
    required: true,
  },

  amount: {
    type: Number, // 1 or 0.5
    required: true,
  },
});

const leaveBalanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    availableLeaves: {
      type: Number,
      default: 0,
    },

    lastCreditMonth: {
      type: Number,
      default: null,
    },

    lastCreditYear: {
      type: Number,
      default: null,
    },

    leaveHistory: [leaveHistorySchema],
  },
  { timestamps: true },
);

export default mongoose.model("LeaveBalance", leaveBalanceSchema);
