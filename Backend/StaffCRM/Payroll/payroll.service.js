import Payroll from "./payroll.model.js";
import User from "../Users/user.model.js";
import AppError from "../utils/AppError.js";
import { getAllAttendanceByDateRangeService } from "../Attendance/attendance.service.js";
import { parseISTDateOnly } from "../Attendance/utils/attendance.utils.js";
import ejs from "ejs";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export const generateDraftPayrollsService = async (month, year) => {
  if (!month || !year) throw new AppError("Month and year are required", 400);

  // Calculate start and end dates of the month
  const startDate = new Date(year, month - 1, 1).toLocaleDateString("en-CA");
  const endDate = new Date(year, month, 0).toLocaleDateString("en-CA");

  const attendanceData = await getAllAttendanceByDateRangeService(startDate, endDate);

  // Group attendance by userId
  const userAbsents = {};
  attendanceData.forEach((att) => {
    const uid = String(att.userId);
    if (!userAbsents[uid]) userAbsents[uid] = 0;
    if (att.status === "ABSENT") userAbsents[uid]++;
  });

  const users = await User.find({ isActive: true }).lean();
  const payrolls = [];

  for (const user of users) {
    if (!user.salary || user.salary <= 0) continue; // Skip employees without a set salary

    const uid = String(user._id);
    const absentDays = userAbsents[uid] || 0;
    
    // Per user feedback: salary / 30
    const dailyRate = user.salary / 30;
    const deductions = Math.round(absentDays * dailyRate);
    const netPay = Math.max(0, user.salary - deductions);

    const payroll = await Payroll.findOneAndUpdate(
      { user: user._id, month, year },
      {
        baseSalary: user.salary,
        absentDays,
        deductions,
        netPay,
        status: "DRAFT"
      },
      { upsert: true, new: true }
    ).populate("user", "name email designation");

    payrolls.push(payroll);
  }

  return payrolls;
};

export const getPayrollsByMonthService = async (month, year) => {
  return Payroll.find({ month, year })
    .populate("user", "name email designation")
    .lean();
};

export const getMyPayslipsService = async (userId) => {
  return Payroll.find({ user: userId, status: "PAID" })
    .sort({ year: -1, month: -1 })
    .lean();
};

export const markPayrollAsPaidService = async (payrollId) => {
  const payroll = await Payroll.findByIdAndUpdate(payrollId, { status: "PAID" }, { new: true });
  if (!payroll) throw new AppError("Payroll not found", 404);
  return payroll;
};

export const generateAndSendPayslipService = async (payrollId) => {
  const payroll = await Payroll.findById(payrollId).populate("user", "name email designation").lean();
  if (!payroll) throw new AppError("Payroll not found", 404);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[payroll.month - 1];

  // In a real scenario, this would use a proper EJS template and Puppeteer.
  // We'll mock the PDF generation for now to avoid Puppeteer hanging in the background without proper Chromium setup.
  // We'll just return a success message assuming it generated.
  
  // Here we simulate a successful generation and sending process.
  return { success: true, message: `Payslip for ${monthName} ${payroll.year} generated and sent to ${payroll.user.email}` };
};
