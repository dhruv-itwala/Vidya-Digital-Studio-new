// Backend/StaffCRM/Users/user.model.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
      enum: ["administrative", "admin", "employee", "hr", "intern"],
      default: "employee",
      lowercase: true,
    },

    subrole: {
      type: String,
      enum: [
        "sales",
        "designing",
        "development",
        "editing",
        "management",
        "administrative",
      ],
      default: "management",
      lowercase: true,
      trim: true,
    },

    customPermissions: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isTerminated: {
      type: Boolean,
      default: false,
    },

    terminationDate: {
      type: Date,
    },

    terminationReason: {
      type: String,
      trim: true,
    },

    terminatedAt: {
      type: Date,
    },

    terminatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    requireOfficeWifi: {
      type: Boolean,
      default: false,
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

    notificationPreferences: {
      type: Object,
      default: {
        leaves: true,
        reports: true,
        tasks: true,
        tickets: true,
      },
    },
  },
  { timestamps: true },
);

// Pre-save hook: Automatically hash password if modified and not already a bcrypt hash
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  if (
    !this.password.startsWith("$2a$") &&
    !this.password.startsWith("$2b$") &&
    !this.password.startsWith("$2y$")
  ) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.index({ isActive: 1, role: 1 });
userSchema.index({ isTerminated: 1 });

export default mongoose.model("User", userSchema);
