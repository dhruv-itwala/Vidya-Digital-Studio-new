import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true }, // 1 to 12
    year: { type: Number, required: true },
    baseSalary: { type: Number, required: true },
    absentDays: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netPay: { type: Number, required: true },
    status: {
      type: String,
      enum: ["DRAFT", "PAID"],
      default: "DRAFT",
    },
  },
  { timestamps: true }
);

// Ensure one payroll per user per month
payrollSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("Payroll", payrollSchema);
