import cron from "node-cron";
import leaveBalanceModel from "./leaveBalance.model.js";
import { ensureMonthlyCredit } from "./leavebalance.service.js";

// Runs every 1st day of month at 00:00 UTC
cron.schedule("0 0 1 * *", async () => {
  console.log("Running monthly leave credit job...");

  const users = await leaveBalanceModel.find().select("user");

  for (const entry of users) {
    await ensureMonthlyCredit(entry.user);
  }

  console.log("Monthly leave credit completed.");
});
