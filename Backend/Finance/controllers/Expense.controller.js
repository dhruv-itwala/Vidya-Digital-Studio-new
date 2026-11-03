import Expense from "../models/Expense.model.js";
import CashAccount from "../models/CashAccount.model.js";
import CashTransaction from "../models/CashTransaction.model.js";
import { asyncHandler } from "../../StaffCRM/utils/asyncHandler.js";
import AppError from "../../StaffCRM/utils/AppError.js";

/* ================= CREATE EXPENSE ================= */
export const createExpense = asyncHandler(async (req, res) => {
  const {
    name,
    category = "Subscription",
    amount,
    frequency = "Monthly",
    dueDate,
    vendor = "",
    status = "Pending",
    department = "All",
    autoGenerate = true,
    notes = "",
  } = req.body;

  if (!name) {
    throw new AppError("Expense name is required", 400);
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    throw new AppError("Valid expense amount is required", 400);
  }

  if (!dueDate) {
    throw new AppError("Due date is required", 400);
  }

  const expense = await Expense.create({
    name,
    category,
    amount: numAmount,
    paidAmount: 0,
    outstandingAmount: numAmount,
    frequency,
    dueDate: new Date(dueDate),
    vendor,
    status,
    department,
    autoGenerate,
    notes,
    createdBy: req.user?._id || req.user?.id,
  });

  res.status(201).json({
    success: true,
    message: "Expense created successfully",
    data: expense,
  });
});

/* ================= GET ALL EXPENSES ================= */
export const getAllExpenses = asyncHandler(async (req, res) => {
  const { category, status, department, search, frequency } = req.query;

  const filter = {};
  if (category && category !== "all") filter.category = category;
  if (department && department !== "all") filter.department = department;
  if (frequency && frequency !== "all") filter.frequency = frequency;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { vendor: { $regex: search, $options: "i" } },
      { notes: { $regex: search, $options: "i" } },
    ];
  }

  const expenses = await Expense.find(filter).sort({ dueDate: 1, createdAt: -1 });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let totalObligations = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  const formattedExpenses = expenses.map((exp) => {
    const obj = exp.toObject();
    const expDueDate = new Date(exp.dueDate);

    // Dynamic overdue calculation
    if (
      obj.outstandingAmount > 0 &&
      obj.status !== "Paid" &&
      obj.status !== "Cancelled" &&
      expDueDate < todayStart
    ) {
      obj.status = "Overdue";
      const diffMs = todayStart - expDueDate;
      obj.daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } else {
      obj.daysOverdue = 0;
    }

    if (obj.status !== "Cancelled") {
      totalObligations += obj.amount || 0;
      totalPaid += obj.paidAmount || 0;
      totalPending += obj.outstandingAmount || 0;
      if (obj.status === "Overdue") {
        totalOverdue += obj.outstandingAmount || 0;
      }
    }

    return obj;
  });

  // Filter by dynamic status if requested
  const finalExpenses = status && status !== "all"
    ? formattedExpenses.filter((e) => e.status.toLowerCase() === status.toLowerCase())
    : formattedExpenses;

  res.status(200).json({
    success: true,
    summary: {
      totalObligations,
      totalPaid,
      totalPending,
      totalOverdue,
      count: finalExpenses.length,
    },
    data: finalExpenses,
  });
});

/* ================= GET EXPENSE BY ID ================= */
export const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  const transactions = await CashTransaction.find({
    referenceId: expense._id,
    referenceModel: "Expense",
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: expense,
    transactions,
  });
});

/* ================= UPDATE EXPENSE ================= */
export const updateExpense = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    amount,
    frequency,
    dueDate,
    vendor,
    status,
    department,
    autoGenerate,
    notes,
  } = req.body;

  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  if (name !== undefined) expense.name = name;
  if (category !== undefined) expense.category = category;
  if (frequency !== undefined) expense.frequency = frequency;
  if (dueDate !== undefined) expense.dueDate = new Date(dueDate);
  if (vendor !== undefined) expense.vendor = vendor;
  if (department !== undefined) expense.department = department;
  if (autoGenerate !== undefined) expense.autoGenerate = autoGenerate;
  if (notes !== undefined) expense.notes = notes;

  if (amount !== undefined) {
    const numAmount = Number(amount);
    expense.amount = numAmount;
    expense.outstandingAmount = Math.max(0, numAmount - (expense.paidAmount || 0));
    if (expense.outstandingAmount === 0 && numAmount > 0) {
      expense.status = "Paid";
    }
  }

  if (status !== undefined) {
    expense.status = status;
    if (status === "Paid") {
      expense.paidAmount = expense.amount;
      expense.outstandingAmount = 0;
    }
  }

  await expense.save();

  res.status(200).json({
    success: true,
    message: "Expense updated successfully",
    data: expense,
  });
});

/* ================= RECORD EXPENSE PAYOUT ================= */
export const recordExpensePayout = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cashAccountId, amount, paymentDate = new Date(), notes = "" } = req.body;

  const expense = await Expense.findById(id);
  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  const payoutAmount = Number(amount);
  if (!payoutAmount || payoutAmount <= 0) {
    throw new AppError("Valid payout amount is required", 400);
  }

  if (payoutAmount > expense.outstandingAmount) {
    throw new AppError(
      `Payout amount (₹${payoutAmount}) cannot exceed outstanding amount (₹${expense.outstandingAmount})`,
      400
    );
  }

  // Deduct from cash account
  const cashAccount = await CashAccount.findById(cashAccountId);
  if (!cashAccount) {
    throw new AppError("Cash account not found", 404);
  }

  cashAccount.currentBalance -= payoutAmount;
  await cashAccount.save();

  // Update expense
  expense.paidAmount = (expense.paidAmount || 0) + payoutAmount;
  expense.outstandingAmount = Math.max(0, expense.amount - expense.paidAmount);
  if (expense.outstandingAmount === 0) {
    expense.status = "Paid";
  } else {
    expense.status = "Partially Paid";
  }
  await expense.save();

  // Record Cash Transaction
  await CashTransaction.create({
    cashAccountId: cashAccount._id,
    type: "EXPENSE",
    amount: payoutAmount,
    balanceAfter: cashAccount.currentBalance,
    category: expense.category,
    referenceId: expense._id,
    referenceModel: "Expense",
    description: `Paid ${expense.category}: ${expense.name} (${notes || "Bill payment"})`,
    performedBy: req.user?._id || req.user?.id,
  });

  res.status(200).json({
    success: true,
    message: `Recorded payment of ₹${payoutAmount} from ${cashAccount.name}`,
    data: expense,
    accountBalance: cashAccount.currentBalance,
  });
});

/* ================= DELETE EXPENSE ================= */
export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  await expense.deleteOne();

  res.status(200).json({
    success: true,
    message: "Expense deleted successfully",
  });
});

