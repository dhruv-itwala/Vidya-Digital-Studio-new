import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    requestId: { type: String, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    userName: String,
    userRole: String,
    category: { type: String, required: true, index: true },
    severity: {
      type: String,
      enum: ["INFO", "WARNING", "CRITICAL", "SECURITY"],
      default: "INFO",
    },
    action: { type: String, required: true, index: true },
    module: { type: String, required: true, index: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    entityName: String,
    description: { type: String, required: true },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ipAddress: String,
    userAgent: {
      raw: String,
      browser: String,
      os: String,
      device: String
    },
    responseTimeMs: Number,
    requestMethod: String,
    requestUrl: String,
    status: { type: String, enum: ["SUCCESS", "FAILED"], default: "SUCCESS" },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

auditLogSchema.index({ timestamp: -1 });

// Text search support
auditLogSchema.index({ userName: "text", entityName: "text", description: "text" });

export default mongoose.model("AuditLog", auditLogSchema);
