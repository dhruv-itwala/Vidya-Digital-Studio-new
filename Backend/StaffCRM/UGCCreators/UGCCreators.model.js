// ============================
// UGCCreators.model.js
// ============================
import mongoose from "mongoose";

const CONTENT_TYPES = [
  "lifestyle",
  "entertainment",
  "food",
  "cooking",
  "travel",
  "fashion",
  "artist",
  "beauty",
  "model",
  "mom",
  "parenting",
  "dancer",
];

const ugcCreatorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    instagramId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    contactNo: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    contentTypes: {
      type: [String],
      enum: CONTENT_TYPES,
      required: true,
      index: true,
    },
    priceDetails: {
      type: String,
    },
    followers: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
  },
  { timestamps: true },
);

// Compound index for better filtering
ugcCreatorSchema.index({ contentTypes: 1, followers: -1 });

export default mongoose.model("UGCCreators", ugcCreatorSchema);
