import mongoose from "mongoose";

const apiLogSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    role: {
      type: String,
      default: "guest",
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    responseTime: {
      type: Number, // in ms
    },
  },
  { timestamps: true }, // createdAt = log time
);

const APILog = mongoose.model("Logs", apiLogSchema);

export default APILog;
