import mongoose from "mongoose";

const contentTaskSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    platform: {
      type: String,
      required: true,
      trim: true,
    },
    postType: {
      type: String,
      required: true, // e.g., 'Story', 'Reel', 'Post', 'Carousel'
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    publishDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    assignedRoles: [
      {
        type: String, // e.g., "Graphic Designer", "Social Media Manager"
        trim: true,
      },
    ],
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ContentTask", contentTaskSchema);
