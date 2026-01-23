import AppError from "../utils/AppError.js";
import { normalizeDate } from "../utils/date.utils.js";
import leaveBalanceModel from "./leaveBalance.model.js";

const MONTHLY_CREDIT = 2;

// ---------- Ensure Monthly Credit ----------
export const ensureMonthlyCredit = async (userId) => {
  const now = new Date();

  const currentMonth = now.getUTCMonth() + 1;
  const currentYear = now.getUTCFullYear();

  let wallet = await leaveBalanceModel.findOne({ user: userId });

  // ✅ Auto-create wallet if missing
  if (!wallet) {
    wallet = await leaveBalanceModel.create({
      user: userId,
      availableLeaves: 0,
      lastCreditMonth: currentMonth - 1,
      lastCreditYear: currentYear,
      leaveHistory: [],
    });
  }

  const monthsPassed =
    (currentYear - wallet.lastCreditYear) * 12 +
    (currentMonth - wallet.lastCreditMonth);

  if (monthsPassed > 0) {
    wallet.availableLeaves += monthsPassed * MONTHLY_CREDIT;
    wallet.lastCreditMonth = currentMonth;
    wallet.lastCreditYear = currentYear;
    await wallet.save();
  }

  return wallet;
};

// ---------- Get Wallet ----------
export const getLeaveBalanceService = async (userId) => {
  const wallet = await ensureMonthlyCredit(userId);
  return wallet;
};

// ---------- Deduct Leave ----------
export const takeLeaveService = async (userId, { type, date }) => {
  const wallet = await ensureMonthlyCredit(userId);

  const amount = type === "HALF_DAY" ? 0.5 : 1;

  if (wallet.availableLeaves < amount) {
    throw new AppError("Insufficient leave balance", 400);
  }

  wallet.availableLeaves -= amount;

  wallet.leaveHistory.push({
    date: normalizeDate(date || new Date()),
    type,
    amount,
  });

  await wallet.save();

  return wallet;
};

// ---------- DEDUCT WHEN LEAVE APPROVED ----------
export const deductForApprovedLeave = async (leave) => {
  if (leave.type === "UNPAID") return;

  const wallet = await ensureMonthlyCredit(leave.user);

  const amount = leave.isHalfDay
    ? 0.5
    : (leave.toDate - leave.fromDate) / (1000 * 60 * 60 * 24) + 1;

  if (wallet.availableLeaves < amount) {
    throw new AppError("Insufficient leave balance", 400);
  }

  wallet.availableLeaves -= amount;

  wallet.leaveHistory.push({
    date: normalizeDate(leave.fromDate),
    type: leave.type === "SICK" ? "SICK" : "CASUAL",
    amount,
  });

  await wallet.save();
};

// ---------- Manual Credit (Admin Optional) ----------
export const addLeavesService = async (userId, amount) => {
  const wallet = await ensureMonthlyCredit(userId);

  wallet.availableLeaves += amount;

  await wallet.save();
  return wallet;
};

// ---------- REFUND WHEN LEAVE CANCELLED ----------
export const refundForCancelledLeave = async (leave) => {
  if (leave.type === "UNPAID") return;

  const wallet = await ensureMonthlyCredit(leave.user);

  const amount = leave.isHalfDay
    ? 0.5
    : (leave.toDate - leave.fromDate) / (1000 * 60 * 60 * 24) + 1;

  wallet.availableLeaves += amount;

  // Remove matching history entry
  wallet.leaveHistory = wallet.leaveHistory.filter(
    (h) =>
      !(
        h.date.getTime() === normalizeDate(leave.fromDate).getTime() &&
        h.amount === amount
      ),
  );

  await wallet.save();
};

// ---------- ADMIN: GET ALL LEAVE BALANCES ----------
export const getAllLeaveBalancesService = async () => {
  const allBalances = await leaveBalanceModel
    .find()
    .populate("user", "name email");
  return allBalances;
};
