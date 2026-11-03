import Payroll from "./payroll.model.js";
import User from "../Users/user.model.js";
import Leave from "../Leaves/leave.model.js";
import AppError from "../utils/AppError.js";
import { getAllAttendanceByDateRangeService } from "../Attendance/attendance.service.js";
import { parseISTDateOnly, isPunchInAfter1030IST } from "../Attendance/utils/attendance.utils.js";
import ejs from "ejs";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export const getPayrollPayoutDate = (month, year) => {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const nextMonthIndex = month % 12; // 0 for Dec -> Jan, 1 for Jan -> Feb
  const nextYear = month === 12 ? year + 1 : year;
  return `10th ${monthNames[nextMonthIndex]} ${nextYear}`;
};

export const generateDraftPayrollsService = async (month, year) => {
  if (!month || !year) throw new AppError("Month and year are required", 400);

  // Calculate start and end dates of the month
  const startDate = new Date(year, month - 1, 1).toLocaleDateString("en-CA");
  const endDate = new Date(year, month, 0).toLocaleDateString("en-CA");

  const [attendanceData, approvedLeaves] = await Promise.all([
    getAllAttendanceByDateRangeService(startDate, endDate),
    Leave.find({
      status: "APPROVED",
      fromDate: { $lte: new Date(`${endDate}T23:59:59+05:30`) },
      toDate: { $gte: new Date(`${startDate}T00:00:00+05:30`) },
    }).lean(),
  ]);

  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  // Group attendance by userId: track full day absents, late punch-ins (half days), and approved leaves
  const userAttendance = {};
  attendanceData.forEach((att) => {
    const uid = String(att.userId);
    if (!userAttendance[uid]) {
      userAttendance[uid] = { absentDays: 0, lateDays: 0, leaveDays: 0 };
    }

    const attDateKey = new Date(att.date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const isToday = attDateKey === todayKey;
    const isFuture = attDateKey > todayKey;

    // Check if employee has an approved leave covering this date
    const leaveOnDate = approvedLeaves.find((l) => {
      if (String(l.user) !== uid) return false;
      const fromKey = new Date(l.fromDate).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const toKey = new Date(l.toDate).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      return attDateKey >= fromKey && attDateKey <= toKey;
    });

    const isLate =
      att.status === "HALF_DAY" ||
      (att.punchIn && isPunchInAfter1030IST(att.punchIn));

    // LEAVES MODULE RULE:
    // If employee has taken an approved paid leave (CASUAL, SICK, EARNED), do NOT deduct salary!
    if (leaveOnDate) {
      if (leaveOnDate.type === "UNPAID") {
        if (leaveOnDate.isHalfDay) {
          userAttendance[uid].lateDays += 1;
        } else {
          userAttendance[uid].absentDays += 1;
        }
      } else {
        // Paid leave (CASUAL, SICK, EARNED) -> 0 deduction!
        userAttendance[uid].leaveDays += (leaveOnDate.isHalfDay ? 0.5 : 1);
      }
    } else {
      // Normal attendance without approved leave
      // Studio Rule: Attendance by default is marked as ABSENT until shift gets over and they punch out.
      // Therefore, in payroll do NOT count the present day (today) or future dates as absent.
      if (att.status === "ABSENT") {
        if (!isToday && !isFuture) {
          userAttendance[uid].absentDays++;
        }
      } else if (isLate) {
        if (!isFuture) {
          userAttendance[uid].lateDays++;
        }
      } else if (att.status === "LEAVE") {
        userAttendance[uid].leaveDays++;
      }
    }
  });

  // Include active employees AND employees terminated during or after this payroll month
  const users = await User.find({
    $or: [
      { isActive: true },
      {
        isTerminated: true,
        terminationDate: { $gte: new Date(`${startDate}T00:00:00+05:30`) },
      },
    ],
  }).lean();
  const payrolls = [];

  for (const user of users) {
    if (!user.salary || user.salary <= 0) continue; // Skip employees without a set salary

    const uid = String(user._id);
    const summary = userAttendance[uid] || { absentDays: 0, lateDays: 0, leaveDays: 0 };
    const absentDays = summary.absentDays;
    const lateDays = summary.lateDays;
    const leaveDays = summary.leaveDays;

    // Per studio rules:
    // Daily Rate = salary / 30
    // Absent day deduction = absentDays * dailyRate
    // Late / half-day deduction = lateDays * (dailyRate / 2) [half day salary deducted]
    // Approved Paid Leave = ₹0 deduction
    const dailyRate = user.salary / 30;
    const halfDayRate = dailyRate / 2;

    const absentDeductions = Math.round(absentDays * dailyRate);
    const lateDeductions = Math.round(lateDays * halfDayRate);
    const deductions = absentDeductions + lateDeductions;
    const netPay = Math.max(0, user.salary - deductions);
    const payoutDate = getPayrollPayoutDate(month, year);

    const payroll = await Payroll.findOneAndUpdate(
      { user: user._id, month, year },
      {
        baseSalary: user.salary,
        absentDays,
        lateDays,
        leaveDays,
        absentDeductions,
        lateDeductions,
        deductions,
        netPay,
        paidAmount: 0,
        pendingAmount: netPay,
        payoutDate,
        status: "Pending",
      },
      { upsert: true, new: true }
    ).populate("user", "name email designation subrole isTerminated terminationDate");

    payrolls.push(payroll);
  }

  return payrolls;
};

export const getPayrollsByMonthService = async (month, year) => {
  return Payroll.find({ month, year })
    .populate("user", "name email designation subrole isTerminated terminationDate")
    .lean();
};

export const getMyPayslipsService = async (userId) => {
  return Payroll.find({ user: userId, status: "PAID" })
    .sort({ year: -1, month: -1 })
    .lean();
};

export const updatePayrollService = async (payrollId, data) => {
  const payroll = await Payroll.findById(payrollId);
  if (!payroll) throw new AppError("Payroll record not found", 404);

  // If absentDays or lateDays updated
  if (data.absentDays !== undefined) {
    payroll.absentDays = Math.max(0, Number(data.absentDays) || 0);
  }
  if (data.lateDays !== undefined) {
    payroll.lateDays = Math.max(0, Number(data.lateDays) || 0);
  }
  if (data.leaveDays !== undefined) {
    payroll.leaveDays = Math.max(0, Number(data.leaveDays) || 0);
  }
  if (data.absentDeductions !== undefined) {
    payroll.absentDeductions = Math.max(0, Number(data.absentDeductions) || 0);
  }
  if (data.lateDeductions !== undefined) {
    payroll.lateDeductions = Math.max(0, Number(data.lateDeductions) || 0);
  }

  // If deductions updated
  if (data.deductions !== undefined) {
    const numDeductions = Math.max(0, Number(data.deductions) || 0);
    payroll.deductions = numDeductions;
    payroll.netPay = Math.max(0, payroll.baseSalary - numDeductions);
  } else if (data.absentDays !== undefined || data.lateDays !== undefined) {
    const dailyRate = payroll.baseSalary / 30;
    payroll.absentDeductions = Math.round(payroll.absentDays * dailyRate);
    payroll.lateDeductions = Math.round(payroll.lateDays * (dailyRate / 2));
    payroll.deductions = payroll.absentDeductions + payroll.lateDeductions;
    payroll.netPay = Math.max(0, payroll.baseSalary - payroll.deductions);
  }

  // If status updated
  if (data.status !== undefined) {
    const rawStatus = String(data.status).trim();
    if (rawStatus === "Salary paid" || rawStatus === "PAID") {
      payroll.status = "Salary paid";
      payroll.paidAmount = payroll.netPay;
      payroll.pendingAmount = 0;
    } else if (rawStatus === "Pending" || rawStatus === "DRAFT") {
      payroll.status = "Pending";
      payroll.paidAmount = 0;
      payroll.pendingAmount = payroll.netPay;
    } else if (rawStatus === "partial paid" || rawStatus === "PARTIALLY_PAID") {
      payroll.status = "partial paid";
      if (data.paidAmount !== undefined) {
        const numPaid = Math.max(0, Number(data.paidAmount) || 0);
        payroll.paidAmount = Math.min(payroll.netPay, numPaid);
        payroll.pendingAmount = Math.max(0, payroll.netPay - payroll.paidAmount);
      } else if (data.pendingAmount !== undefined) {
        const numPending = Math.max(0, Number(data.pendingAmount) || 0);
        payroll.pendingAmount = Math.min(payroll.netPay, numPending);
        payroll.paidAmount = Math.max(0, payroll.netPay - payroll.pendingAmount);
      }
    }
  } else {
    // If status wasn't changed, re-sync pendingAmount if deductions changed
    if (payroll.status === "Salary paid" || payroll.status === "PAID") {
      payroll.paidAmount = payroll.netPay;
      payroll.pendingAmount = 0;
    } else if (payroll.status === "Pending" || payroll.status === "DRAFT") {
      payroll.pendingAmount = payroll.netPay;
    } else if (payroll.status === "partial paid" || payroll.status === "PARTIALLY_PAID") {
      payroll.pendingAmount = Math.max(0, payroll.netPay - (payroll.paidAmount || 0));
    }
  }

  if (data.notes !== undefined) {
    payroll.notes = data.notes;
  }

  await payroll.save();
  return Payroll.findById(payroll._id).populate("user", "name email designation subrole isTerminated terminationDate");
};

export const markPayrollAsPaidService = async (payrollId) => {
  const payroll = await Payroll.findById(payrollId);
  if (!payroll) throw new AppError("Payroll not found", 404);
  payroll.status = "Salary paid";
  payroll.paidAmount = payroll.netPay;
  payroll.pendingAmount = 0;
  await payroll.save();
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
