// Backend/Holidays/holiday.controller.js

import * as service from "./holiday.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity, captureBeforeState } from "../AuditLog/AuditLog.service.js";
import Holiday from "./holiday.model.js";

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
  logActivity({
    req,
    user: req.user,
    category: "System",
    module: "Holidays",
    action: "CREATE",
    entityId: holiday._id,
    entityName: holiday.title,
    description: `${req.user.name} created holiday '${holiday.title}'`,
  });
  res.status(201).json({
    success: true,
    message: "Holiday created successfully",
    data: holiday,
  });
});

// ============== UPDATE =======================
export const updateHoliday = asyncHandler(async (req, res) => {
  const beforeDoc = await captureBeforeState(Holiday, req.params.id);
  const holiday = await service.updateHolidayService(req.params.id, req.body);
  logActivity({
    req,
    user: req.user,
    category: "System",
    module: "Holidays",
    action: "UPDATE",
    entityId: holiday._id,
    entityName: holiday.title,
    description: `${req.user.name} updated holiday '${holiday.title}'`,
    changes: { before: beforeDoc, after: holiday }
  });
  res.json({
    success: true,
    message: "Holiday updated successfully",
    data: holiday,
  });
});

// ============== DELETE =======================
export const deleteHoliday = asyncHandler(async (req, res) => {
  const result = await service.deleteHolidayService(req.params.id);
  logActivity({
    req,
    user: req.user,
    category: "System",
    severity: "WARNING",
    module: "Holidays",
    action: "DELETE",
    entityId: req.params.id,
    description: `${req.user.name} deleted a holiday`,
  });
  res.json({
    success: true,
    ...result,
  });
});
