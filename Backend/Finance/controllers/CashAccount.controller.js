import CashAccount from "../models/CashAccount.model.js";
import CashTransaction from "../models/CashTransaction.model.js";
import { asyncHandler } from "../../StaffCRM/utils/asyncHandler.js";
import AppError from "../../StaffCRM/utils/AppError.js";

/* ================= CREATE CASH ACCOUNT ================= */
export const createCashAccount = asyncHandler(async (req, res) => {
  const {
    name,
    accountNumber,
    ifscCode = "UBIN0553425",
    accountHolderName = "Dheemahi Arkeshbhai Joshi",
    upiId = "dheemahi2@okhdfcbank",
    type = "BANK",
    openingBalance = 0,
    currency = "INR",
  } = req.body;

  if (!name) {
    throw new AppError("Account name is required", 400);
  }

  const numOpening = Number(openingBalance) || 0;

  // Single bank account rule: If an account already exists, update it rather than creating multiple
  let account = await CashAccount.findOne();
  if (account) {
    account.name = name;
    if (accountNumber !== undefined) account.accountNumber = accountNumber;
    if (ifscCode !== undefined) account.ifscCode = ifscCode;
    if (accountHolderName !== undefined) account.accountHolderName = accountHolderName;
    if (upiId !== undefined) account.upiId = upiId;
    if (type !== undefined) account.type = type;
    account.isDefault = true;
    account.status = "active";
    await account.save();

    return res.status(200).json({
      success: true,
      message: "Studio bank account configured successfully",
      data: account,
    });
  }

  account = await CashAccount.create({
    name,
    accountNumber,
    ifscCode,
    accountHolderName,
    upiId,
    type,
    openingBalance: numOpening,
    currentBalance: numOpening,
    currency,
    isDefault: true,
    status: "active",
  });

  if (numOpening > 0) {
    await CashTransaction.create({
      cashAccountId: account._id,
      type: "ADJUSTMENT",
      amount: numOpening,
      balanceAfter: numOpening,
      category: "Opening Balance",
      description: `Initial opening balance for ${name}`,
      performedBy: req.user?._id || req.user?.id,
    });
  }

  res.status(201).json({
    success: true,
    message: "Studio bank account created successfully",
    data: account,
  });
});

/* ================= GET ALL CASH ACCOUNTS ================= */
export const getAllCashAccounts = asyncHandler(async (req, res) => {
  let accounts = await CashAccount.find().sort({ isDefault: -1, createdAt: 1 });

  // If no account exists yet, create default studio Union Bank account
  if (accounts.length === 0) {
    const defaultAccount = await CashAccount.create({
      name: "Union Bank of India",
      accountNumber: "534202010030024",
      ifscCode: "UBIN0553425",
      accountHolderName: "Dheemahi Arkeshbhai Joshi",
      upiId: "dheemahi2@okhdfcbank",
      type: "BANK",
      openingBalance: 0,
      currentBalance: 0,
      currency: "INR",
      isDefault: true,
      status: "active",
    });
    accounts.push(defaultAccount);
  } else {
    // Backfill any missing fields on primary account
    let updated = false;
    const primary = accounts[0];
    if (!primary.ifscCode) {
      primary.ifscCode = "UBIN0553425";
      updated = true;
    }
    if (!primary.accountHolderName) {
      primary.accountHolderName = "Dheemahi Arkeshbhai Joshi";
      updated = true;
    }
    if (!primary.upiId) {
      primary.upiId = "dheemahi2@okhdfcbank";
      updated = true;
    }
    if (updated) {
      await primary.save();
    }
  }

  // Enforce single primary bank account representation
  const primaryAccount = accounts.find((a) => a.isDefault) || accounts[0];
  const singleAccountList = [primaryAccount];

  const totalBalance = Number(primaryAccount.currentBalance) || 0;

  res.status(200).json({
    success: true,
    totalBalance,
    count: 1,
    data: singleAccountList,
  });
});

/* ================= GET SINGLE CASH ACCOUNT ================= */
export const getCashAccountById = asyncHandler(async (req, res) => {
  const account = await CashAccount.findById(req.params.id);
  if (!account) {
    throw new AppError("Account not found", 404);
  }

  const transactions = await CashTransaction.find({ cashAccountId: account._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("performedBy", "name email");

  res.status(200).json({
    success: true,
    data: account,
    transactions,
  });
});

/* ================= UPDATE CASH ACCOUNT ================= */
export const updateCashAccount = asyncHandler(async (req, res) => {
  const { name, accountNumber, ifscCode, accountHolderName, upiId, type, isDefault, status } = req.body;

  const account = await CashAccount.findById(req.params.id);
  if (!account) {
    throw new AppError("Account not found", 404);
  }

  if (isDefault) {
    await CashAccount.updateMany({ _id: { $ne: account._id } }, { isDefault: false });
  }

  if (name !== undefined) account.name = name;
  if (accountNumber !== undefined) account.accountNumber = accountNumber;
  if (ifscCode !== undefined) account.ifscCode = ifscCode;
  if (accountHolderName !== undefined) account.accountHolderName = accountHolderName;
  if (upiId !== undefined) account.upiId = upiId;
  if (type !== undefined) account.type = type;
  if (isDefault !== undefined) account.isDefault = isDefault;
  if (status !== undefined) account.status = status;

  await account.save();

  res.status(200).json({
    success: true,
    message: "Bank account updated successfully",
    data: account,
  });
});

/* ================= ADJUST ACCOUNT BALANCE ================= */
export const adjustAccountBalance = asyncHandler(async (req, res) => {
  const { newBalance, reason = "Manual Balance Adjustment" } = req.body;

  const account = await CashAccount.findById(req.params.id);
  if (!account) {
    throw new AppError("Account not found", 404);
  }

  const targetBalance = Number(newBalance);
  if (isNaN(targetBalance)) {
    throw new AppError("Valid new balance amount is required", 400);
  }

  const difference = targetBalance - account.currentBalance;
  if (difference === 0) {
    return res.status(200).json({
      success: true,
      message: "Balance already matches target",
      data: account,
    });
  }

  account.currentBalance = targetBalance;
  await account.save();

  await CashTransaction.create({
    cashAccountId: account._id,
    type: "ADJUSTMENT",
    amount: Math.abs(difference),
    balanceAfter: targetBalance,
    category: "Reconciliation",
    description: `${reason} (${difference > 0 ? "+" : "-"}₹${Math.abs(difference)})`,
    performedBy: req.user?._id || req.user?.id,
  });

  res.status(200).json({
    success: true,
    message: "Account balance adjusted successfully",
    data: account,
  });
});

/* ================= TRANSFER BETWEEN ACCOUNTS ================= */
export const transferBetweenAccounts = asyncHandler(async (req, res) => {
  const { fromAccountId, toAccountId, amount, notes = "Account Transfer" } = req.body;

  const transferAmount = Number(amount);
  if (!transferAmount || transferAmount <= 0) {
    throw new AppError("Transfer amount must be greater than zero", 400);
  }

  if (fromAccountId === toAccountId) {
    throw new AppError("Source and destination accounts must be different", 400);
  }

  const fromAcc = await CashAccount.findById(fromAccountId);
  const toAcc = await CashAccount.findById(toAccountId);

  if (!fromAcc || !toAcc) {
    throw new AppError("One or both cash accounts not found", 404);
  }

  if (fromAcc.currentBalance < transferAmount) {
    throw new AppError(
      `Insufficient funds in ${fromAcc.name}. Available: ₹${fromAcc.currentBalance}, Required: ₹${transferAmount}`,
      400
    );
  }

  fromAcc.currentBalance -= transferAmount;
  toAcc.currentBalance += transferAmount;

  await fromAcc.save();
  await toAcc.save();

  // Outgoing transaction
  await CashTransaction.create({
    cashAccountId: fromAcc._id,
    type: "TRANSFER",
    amount: transferAmount,
    balanceAfter: fromAcc.currentBalance,
    category: "Transfer Out",
    referenceId: toAcc._id,
    referenceModel: "CashAccount",
    description: `Transfer to ${toAcc.name}: ${notes}`,
    performedBy: req.user?._id || req.user?.id,
  });

  // Incoming transaction
  await CashTransaction.create({
    cashAccountId: toAcc._id,
    type: "TRANSFER",
    amount: transferAmount,
    balanceAfter: toAcc.currentBalance,
    category: "Transfer In",
    referenceId: fromAcc._id,
    referenceModel: "CashAccount",
    description: `Transfer from ${fromAcc.name}: ${notes}`,
    performedBy: req.user?._id || req.user?.id,
  });

  res.status(200).json({
    success: true,
    message: `Transferred ₹${transferAmount} from ${fromAcc.name} to ${toAcc.name}`,
    fromAccount: fromAcc,
    toAccount: toAcc,
  });
});

/* ================= GET TRANSACTIONS ================= */
export const getCashTransactions = asyncHandler(async (req, res) => {
  const { accountId, type, page = 1, limit = 30 } = req.query;

  const filter = {};
  if (accountId) filter.cashAccountId = accountId;
  if (type) filter.type = type;

  const skip = (Number(page) - 1) * Number(limit);

  const [transactions, total] = await Promise.all([
    CashTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("cashAccountId", "name type currency")
      .populate("performedBy", "name email"),
    CashTransaction.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: transactions,
  });
});

