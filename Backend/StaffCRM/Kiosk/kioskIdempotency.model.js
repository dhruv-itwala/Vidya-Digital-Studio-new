// Backend/StaffCRM/Kiosk/kioskIdempotency.model.js
import mongoose from "mongoose";

/**
 * Durable idempotency tracking model for Android kiosk attendance punches.
 * Provides atomic deduplication and survives process restarts.
 * Automatically cleans up old keys via MongoDB 24-hour TTL index.
 */
const kioskIdempotencySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["PUNCH_IN", "PUNCH_OUT"],
    },
    status: {
      type: String,
      required: true,
      enum: ["PROCESSING", "COMPLETED", "FAILED"],
      default: "PROCESSING",
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // MongoDB TTL index: 24 hours (86,400 seconds)
    },
  },
  {
    timestamps: true,
  },
);

const KioskIdempotency =
  mongoose.models.KioskIdempotency ||
  mongoose.model("KioskIdempotency", kioskIdempotencySchema);

export default KioskIdempotency;

