import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fromDate: {
      type: Date,
      required: true,
    },

    toDate: {
      type: Date,
      required: true,
    },

    type: {
      type: String,
      enum: ["CASUAL", "SICK", "UNPAID"],
      required: true,
    },

    isHalfDay: {
      type: Boolean,
      default: false,
    },

    reason: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "DECLINED", "CANCELLED"],
      default: "PENDING",
    },

    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Leave", leaveSchema);
