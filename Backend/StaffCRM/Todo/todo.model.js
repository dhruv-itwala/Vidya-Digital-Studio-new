import mongoose from "mongoose";

const todoItemSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  done: {
    type: Boolean,
    default: false,
  },
});

const todoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      default: "Today",
    },

    date: {
      type: String, // "2026-01-11"
      required: true,
    },

    items: [todoItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Todo", todoSchema);
