import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // important for security
    },

    role: {
      type: String,
      enum: ["admin", "employee", "hr"],
      default: "employee",
      lowercase: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    salary: {
      type: Number,
    },

    joiningDate: {
      type: Date,
      required: true,
    },

    designation: {
      type: String,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    contactNo: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/, // adjust regex if needed
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    address: {
      type: String,
    },

    personalEmail: {
      type: String,
      lowercase: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
