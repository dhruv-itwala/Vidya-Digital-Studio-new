import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Expense name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Subscription",
        "Recurring",
        "One-Time",
        "Bill",
        "Vendor",
        "Other",
      ],
      default: "Subscription",
    },
    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    frequency: {
      type: String,
      enum: ["Monthly", "Quarterly", "Yearly", "One-Time"],
      default: "Monthly",
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    vendor: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "Upcoming",
        "Due",
        "Pending",
        "Partially Paid",
        "Paid",
        "Overdue",
        "Cancelled",
      ],
      default: "Pending",
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingAmount: {
      type: Number,
      default: function () {
        return this.amount;
      },
      min: 0,
    },
    department: {
      type: String,
      enum: [
        "All",
        "sales",
        "designing",
        "development",
        "editing",
        "management",
        "administrative",
      ],
      default: "All",
    },
    autoGenerate: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ category: 1, status: 1, dueDate: 1 });
expenseSchema.index({ department: 1 });

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;

