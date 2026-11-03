import mongoose from "mongoose";

const cashAccountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    ifscCode: {
      type: String,
      trim: true,
      default: "UBIN0553425",
    },
    accountHolderName: {
      type: String,
      trim: true,
      default: "Dheemahi Arkeshbhai Joshi",
    },
    upiId: {
      type: String,
      trim: true,
      default: "dheemahi2@okhdfcbank",
    },
    type: {
      type: String,
      enum: ["BANK", "CASH", "UPI", "OTHER"],
      default: "BANK",
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

cashAccountSchema.index({ status: 1 });

const CashAccount = mongoose.model("CashAccount", cashAccountSchema);
export default CashAccount;

