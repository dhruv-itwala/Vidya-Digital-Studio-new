import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      required: true,
    },

    type: {
      type: String,
      enum: [
        "SYSTEM",
        "BREAK_REMINDER",
        "BREAK_END",
        "BREAK_OVERTIME",
        "REPORT_REMINDER",
        "WORK_COMPLETE",
        "PUNCH_OUT_REMINDER",
        "PUNCH_IN_REMINDER",
      ],
      default: "SYSTEM",
    },

    response: {
      type: Object,
      default: null,
    },

    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("NotificationLog", notificationSchema);
