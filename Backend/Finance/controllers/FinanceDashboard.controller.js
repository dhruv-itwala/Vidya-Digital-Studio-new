import CashAccount from "../models/CashAccount.model.js";
import CashTransaction from "../models/CashTransaction.model.js";
import Expense from "../models/Expense.model.js";
import Invoice from "../../Invoice/models/Invoice.model.js";
import Payroll from "../../StaffCRM/Payroll/payroll.model.js";
import User from "../../StaffCRM/Users/user.model.js";
import { asyncHandler } from "../../StaffCRM/utils/asyncHandler.js";

/* ================= GET FINANCE DASHBOARD METRICS ================= */
export const getFinanceDashboardMetrics = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Current Cash in primary studio bank account
  let accounts = await CashAccount.find({ status: "active" }).sort({ isDefault: -1, createdAt: 1 });
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
    accounts = [defaultAccount];
  }
  const primaryAccount = accounts.find((a) => a.isDefault) || accounts[0];
  const currentCash = Number(primaryAccount?.currentBalance) || 0;

  // 2. Expected Receivables from Invoices (where status is unpaid or partial)
  const invoices = await Invoice.find({
    status: { $ne: "paid" },
  })
    .sort({ createdAt: -1 })
    .lean();

  let totalReceivables = 0;
  let overdueReceivables = 0;
  let upcomingReceivables = 0;
  const overdueInvoiceList = [];

  invoices.forEach((inv) => {
    // If remainingAmount is explicitly stored, use it; otherwise compute from totalAmount - advanceAmount
    const remaining =
      typeof inv.remainingAmount === "number"
        ? inv.remainingAmount
        : Math.max(0, (inv.totalAmount || 0) - (inv.advanceAmount || 0));

    if (remaining > 0) {
      totalReceivables += remaining;

      let isOverdue = false;
      if (inv.remainingDate) {
        const dueDate = new Date(inv.remainingDate);
        if (!isNaN(dueDate.getTime()) && dueDate < todayStart) {
          isOverdue = true;
        }
      }

      if (isOverdue) {
        overdueReceivables += remaining;
        overdueInvoiceList.push({
          _id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.client?.name || inv.client?.companyName || "Client",
          companyName: inv.client?.companyName || "",
          amount: inv.totalAmount,
          advancePaid: inv.advanceAmount || 0,
          remainingAmount: remaining,
          dueDate: inv.remainingDate,
          phone: inv.client?.phone || "",
        });
      } else {
        upcomingReceivables += remaining;
      }
    }
  });

  // 3. Payroll Obligations (Due Payrolls by 10th of the Month Rule)
  // Studio Rule:
  // Salaries for work month M are disbursed on the 10th of month M+1.
  // - If today < 10th of current month (e.g., Nov 2): payouts for prior month (Oct) are not yet due (due 10th Nov).
  //   Only payrolls through month M-2 (e.g. September) whose 10th has arrived are due.
  // - If today >= 10th of current month (e.g., Nov 10): payouts for prior month (Oct) are now due.
  //   Payrolls through month M-1 (e.g. October) are due.
  // Future or current work months (e.g. November, payout Dec 10) are NEVER included until their 10th arrives.
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const curYear = nowIST.getFullYear();
  const curMonth = nowIST.getMonth() + 1; // 1 to 12
  const curDay = nowIST.getDate(); // 1 to 31

  let maxWorkMonth;
  let maxWorkYear = curYear;

  if (curDay < 10) {
    // Before 10th: show data up to 2 months prior (e.g. Nov 2 -> September)
    maxWorkMonth = curMonth - 2;
    if (maxWorkMonth <= 0) {
      maxWorkMonth += 12;
      maxWorkYear -= 1;
    }
  } else {
    // 10th onwards: show data up to 1 month prior (e.g. Nov 10 -> October)
    maxWorkMonth = curMonth - 1;
    if (maxWorkMonth <= 0) {
      maxWorkMonth += 12;
      maxWorkYear -= 1;
    }
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const payrollCutoffLabel = `${monthNames[maxWorkMonth - 1]} ${maxWorkYear}`;

  const pendingPayrolls = await Payroll.find({
    status: { $nin: ["PAID", "Salary paid"] },
    $or: [
      { year: { $lt: maxWorkYear } },
      { year: maxWorkYear, month: { $lte: maxWorkMonth } },
    ],
  })
    .populate("user", "name email designation salary subrole")
    .lean();

  let payrollPending = 0;
  const duePayrollsList = [];

  pendingPayrolls.forEach((p) => {
    const pending =
      typeof p.pendingAmount === "number"
        ? p.pendingAmount
        : Math.max(0, (Number(p.netPay) || 0) - (Number(p.paidAmount) || 0));

    if (pending > 0) {
      payrollPending += pending;
      duePayrollsList.push(p);
    }
  });

  // 4. Expense Obligations (Subscriptions, Bills, Vendor bills)
  const pendingExpenses = await Expense.find({
    status: { $nin: ["Paid", "Cancelled"] },
  })
    .sort({ dueDate: 1 })
    .lean();

  let expensePending = 0;
  let subscriptionPending = 0;
  let billPending = 0;
  let vendorPending = 0;
  let otherExpensePending = 0;

  const upcomingRenewals = [];

  pendingExpenses.forEach((exp) => {
    const outstanding = Number(exp.outstandingAmount) || 0;
    expensePending += outstanding;

    if (exp.category === "Subscription") subscriptionPending += outstanding;
    else if (exp.category === "Bill") billPending += outstanding;
    else if (exp.category === "Vendor") vendorPending += outstanding;
    else otherExpensePending += outstanding;

    // Next 14 days renewal
    const dueDate = new Date(exp.dueDate);
    const diffDays = Math.ceil((dueDate - todayStart) / (1000 * 60 * 60 * 24));
    if (diffDays <= 14) {
      upcomingRenewals.push({
        _id: exp._id,
        name: exp.name,
        category: exp.category,
        amount: exp.amount,
        outstandingAmount: outstanding,
        dueDate: exp.dueDate,
        daysRemaining: diffDays,
        vendor: exp.vendor || "",
      });
    }
  });

  // 5. Total Payables & Core Invariants
  const totalPayables = payrollPending + expensePending;
  const reservedCash = Math.min(currentCash, totalPayables);
  const freeCash = Math.max(0, currentCash - totalPayables);
  const projectedCash = currentCash + totalReceivables - totalPayables;

  // 6. Recent Cash Transactions
  const recentTransactions = await CashTransaction.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("cashAccountId", "name type currency")
    .populate("performedBy", "name")
    .lean();

  // 7. Department-wise Payroll Budget Breakdown (Active Staff)
  const activeStaff = await User.find({ isActive: true })
    .select("name salary designation subrole")
    .lean();

  const departmentCost = {
    sales: 0,
    designing: 0,
    development: 0,
    editing: 0,
    management: 0,
    administrative: 0,
  };

  let totalActiveStaffSalary = 0;
  activeStaff.forEach((staff) => {
    const sal = Number(staff.salary) || 0;
    totalActiveStaffSalary += sal;
    const sub = (staff.subrole || "management").toLowerCase();
    if (departmentCost[sub] !== undefined) {
      departmentCost[sub] += sal;
    } else {
      departmentCost.management += sal;
    }
  });

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        currentCash,
        totalReceivables,
        overdueReceivables,
        upcomingReceivables,
        totalPayables,
        payrollPending,
        expensePending,
        reservedCash,
        freeCash,
        projectedCash,
      },
      payrollCutoffLabel,
      payrollCutoffWorkMonth: maxWorkMonth,
      payrollCutoffWorkYear: maxWorkYear,
      expenseBreakdown: {
        subscriptions: subscriptionPending,
        bills: billPending,
        vendors: vendorPending,
        other: otherExpensePending,
      },
      departmentCost,
      totalActiveStaffSalary,
      activeStaffCount: activeStaff.length,
      accounts: [primaryAccount],
      recentTransactions,
      upcomingRenewals: upcomingRenewals.slice(0, 6),
      overdueInvoices: overdueInvoiceList.slice(0, 6),
      pendingPayrollsCount: duePayrollsList.length,
    },
  });
});

