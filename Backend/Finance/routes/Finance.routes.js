import express from "express";
import { protect } from "../../StaffCRM/middleware/auth.middleware.js";
import { roleCheck } from "../../StaffCRM/middleware/role.middleware.js";

import * as dashboardCtrl from "../controllers/FinanceDashboard.controller.js";
import * as expenseCtrl from "../controllers/Expense.controller.js";
import * as accountCtrl from "../controllers/CashAccount.controller.js";

const router = express.Router();

// All finance routes require authenticated Admin, HR, or Administrative access
router.use(protect);
router.use(roleCheck("admin", "hr"));

/* ================= DASHBOARD & KPIS ================= */
router.get("/overview", dashboardCtrl.getFinanceDashboardMetrics);

/* ================= EXPENSES ================= */
router.post("/expenses", expenseCtrl.createExpense);
router.get("/expenses", expenseCtrl.getAllExpenses);
router.get("/expenses/:id", expenseCtrl.getExpenseById);
router.put("/expenses/:id", expenseCtrl.updateExpense);
router.delete("/expenses/:id", expenseCtrl.deleteExpense);
router.post("/expenses/:id/payout", expenseCtrl.recordExpensePayout);

/* ================= CASH & BANK ACCOUNTS ================= */
router.post("/accounts", accountCtrl.createCashAccount);
router.get("/accounts", accountCtrl.getAllCashAccounts);
router.get("/accounts/:id", accountCtrl.getCashAccountById);
router.put("/accounts/:id", accountCtrl.updateCashAccount);
router.post("/accounts/:id/adjust", accountCtrl.adjustAccountBalance);
router.post("/accounts/transfer", accountCtrl.transferBetweenAccounts);
router.get("/transactions", accountCtrl.getCashTransactions);

export default router;

