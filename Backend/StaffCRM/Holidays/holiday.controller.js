// Backend/Holidays/holiday.controller.js

import * as service from "./holiday.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ============== ALL HOLIDAYS =======================
export const getHolidays = asyncHandler(async (req, res) => {
  const data = await service.getAllHolidaysService();
  res.json({ success: true, data });
});

// ============== UPCOMING HOLIDAYS =======================
export const getUpcomingHolidays = asyncHandler(async (req, res) => {
  const data = await service.getUpcomingHolidaysService();
  res.json({ success: true, data });
});

// ============== CREATE =======================
export const createHoliday = asyncHandler(async (req, res) => {
  const holiday = await service.createHolidayService(req.body);
  res.status(201).json({
    success: true,
    message: "Holiday created successfully",
    data: holiday,
  });
});

// ============== UPDATE =======================
export const updateHoliday = asyncHandler(async (req, res) => {
  const holiday = await service.updateHolidayService(req.params.id, req.body);
  res.json({
    success: true,
    message: "Holiday updated successfully",
    data: holiday,
  });
});

// ============== DELETE =======================
export const deleteHoliday = asyncHandler(async (req, res) => {
  const result = await service.deleteHolidayService(req.params.id);
  res.json({
    success: true,
    ...result,
  });
});
