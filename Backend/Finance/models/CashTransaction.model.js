import mongoose from "mongoose";

const cashTransactionSchema = new mongoose.Schema(
  {
    cashAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CashAccount",
      required: [true, "Cash account is required"],
    },
    type: {
      type: String,
      enum: ["INCOME", "EXPENSE", "PAYROLL", "TRANSFER", "ADJUSTMENT"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Transaction amount must be greater than zero"],
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    referenceModel: {
      type: String,
      enum: ["Invoice", "Expense", "Payroll", "CashAccount", null],
      default: null,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

cashTransactionSchema.index({ cashAccountId: 1, createdAt: -1 });
cashTransactionSchema.index({ type: 1 });

const CashTransaction = mongoose.model("CashTransaction", cashTransactionSchema);
export default CashTransaction;

