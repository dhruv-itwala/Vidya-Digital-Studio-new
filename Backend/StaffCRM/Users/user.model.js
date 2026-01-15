// Backend/StaffCRM/Users/user.model.js
import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
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

    salary: { type: Number, min: 0 },

    joiningDate: {
      type: Date,
      required: true,
    },

    designation: {
      type: String,
      trim: true,
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
      trim: true,
    },

    personalEmail: {
      type: String,
      lowercase: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ isActive: 1, role: 1 });

export default mongoose.model("User", userSchema);
