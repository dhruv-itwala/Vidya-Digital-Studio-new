import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true }, // 1 to 12
    year: { type: Number, required: true },
    baseSalary: { type: Number, required: true },
    absentDays: { type: Number, default: 0 },
    lateDays: { type: Number, default: 0 }, // late / half-days count
    leaveDays: { type: Number, default: 0 }, // approved paid leaves count (CASUAL, SICK, EARNED)
    absentDeductions: { type: Number, default: 0 }, // absentDays * (baseSalary / 30)
    lateDeductions: { type: Number, default: 0 }, // lateDays * (baseSalary / 60) [half day salary]
    deductions: { type: Number, default: 0 },
    netPay: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    payoutDate: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PAID",
        "PARTIALLY_PAID",
        "PENDING",
        "Salary paid",
        "Pending",
        "partial paid",
      ],
      default: "Pending",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Ensure one payroll per user per month
payrollSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("Payroll", payrollSchema);
