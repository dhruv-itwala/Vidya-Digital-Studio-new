import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    // Basic Info
    profilePhoto: String,
    clientName: { type: String, required: true, trim: true },
    ownerName: { type: String, trim: true },
    email: { type: String, lowercase: true },
    phone: String,
    address: String,

    // Package Details
    services: [String],
    onboardingDate: { type: Date, default: Date.now },
    billingType: {
      type: String,
      enum: ["one-time", "monthly"],
      required: true,
    },

    // Billing
    totalAmount: {
      type: Number,
      required: function () {
        return (
          this.billingType === "one-time" || this.billingType === "monthly"
        );
      },
    },
    monthlyAmount: {
      type: Number,
      required: function () {
        return this.billingType === "monthly";
      },
    },
    tenure: {
      type: Number,
      required: function () {
        return this.billingType === "monthly";
      },
    },

    // Payment
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },

    transactions: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
      },
    ],

    // Credentials
    credentials: [
      {
        platform: String,
        username: String,
        password: String,
        note: String,
      },
    ],

    // Meta
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default mongoose.model("Client", clientSchema);
