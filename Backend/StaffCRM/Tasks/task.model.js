import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    details: {
      type: String,
      default: "",
    },

    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    startDate: Date,
    endDate: Date,
    completedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "started", "hold", "complete"],
      default: "pending",
    },

    holdReason: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: ["admin", "employee", "hr", "intern"],
        required: true,
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model("Task", taskSchema);
