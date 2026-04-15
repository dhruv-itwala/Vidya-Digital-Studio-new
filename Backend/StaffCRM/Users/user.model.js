// Backend/StaffCRM/Users/user.model.js
import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    profilePicture: {
      url: String,
      public_id: String,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      match: /^[0-9]{10}$/,
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
      enum: ["admin", "employee", "hr", "intern"],
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
      //emergency contact number
      type: String,
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
  { timestamps: true },
);

userSchema.index({ isActive: 1, role: 1 });

export default mongoose.model("User", userSchema);
