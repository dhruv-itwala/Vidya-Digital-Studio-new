import mongoose from "mongoose";

const whatsappMessageSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    from: {
      type: String,
      required: true,
      trim: true,
    },
    to: {
      type: String,
      required: true,
      trim: true,
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      default: "text",
    },
    body: {
      type: String,
      required: true,
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    mediaId: {
      type: String,
      trim: true,
    },
    mimeType: {
      type: String,
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
    },
    buttonReplyId: {
      type: String,
    },
    listReplyId: {
      type: String,
    },
    senderName: {
      type: String,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },
    status: {
      type: String,
      enum: ["received", "sent", "failed"],
      default: "received",
    },
  },
  { timestamps: true }
);

whatsappMessageSchema.index({ phone: 1, createdAt: -1 });

export default mongoose.model("WhatsappMessage", whatsappMessageSchema);
