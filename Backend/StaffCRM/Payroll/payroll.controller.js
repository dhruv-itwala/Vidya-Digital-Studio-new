import {asyncHandler} from "../utils/asyncHandler.js";
import * as service from "./payroll.service.js";

export const generateDraftPayrolls = asyncHandler(async (req, res) => {
  const { month, year } = req.body;
  const data = await service.generateDraftPayrollsService(Number(month), Number(year));
  res.status(201).json({ success: true, count: data.length, data });
});

export const getPayrollsByMonth = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const data = await service.getPayrollsByMonthService(Number(month), Number(year));
  res.json({ success: true, count: data.length, data });
});

export const getMyPayslips = asyncHandler(async (req, res) => {
  const data = await service.getMyPayslipsService(req.user.id);
  res.json({ success: true, count: data.length, data });
});

export const markPayrollAsPaid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await service.markPayrollAsPaidService(id);
  res.json({ success: true, data });
});

export const sendPayslip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await service.generateAndSendPayslipService(id);
  res.json({ success: true, message: result.message });
});
