// Backend/StaffCRM/Kiosk/kiosk.service.js
import mongoose from "mongoose";
import User from "../Users/user.model.js";
import WorkRecord from "../Attendance/workRecord.model.js";
import Holiday from "../Holidays/holiday.model.js";
import AppError from "../utils/AppError.js";
import {
  punchInService,
  punchOutService,
} from "../Attendance/attendance.service.js";
import {
  todayISTUTC,
  parseISTDateOnly,
  calcLiveNetSeconds,
} from "../Attendance/utils/attendance.utils.js";
import { logActivity } from "../AuditLog/AuditLog.service.js";

/**
 * Retrieves sanitized list of active employees and their live attendance status for today.
 * Does NOT expose password, salary, phone, personalEmail, contactNo, or permissions.
 */
export const getKioskEmployeesService = async (search = "", dateStr = null) => {
  const queryDate = dateStr ? parseISTDateOnly(dateStr) : todayISTUTC();

  // Search filter
  const userFilter = { isActive: true };
  if (search && search.trim()) {
    userFilter.name = { $regex: search.trim(), $options: "i" };
  }

  // Fetch active users, today's work records, and holiday status concurrently
  const [users, workRecords, holiday] = await Promise.all([
    User.find(userFilter)
      .select("name role designation profilePicture")
      .lean(),
    WorkRecord.find({ date: queryDate }).lean(),
    Holiday.findOne({ date: queryDate }).lean(),
  ]);

  const workRecordMap = new Map();
  workRecords.forEach((w) => workRecordMap.set(String(w.user), w));

  // Role sorting priority: admin -> hr -> employee -> intern, then alphabetical
  const rolePriority = { admin: 1, hr: 2, employee: 3, intern: 4 };
  users.sort(
    (a, b) =>
      (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99) ||
      a.name.localeCompare(b.name),
  );

  return users.map((u) => {
    const record = workRecordMap.get(String(u._id));

    let status = "NOT_STARTED";
    let nextAllowedAction = "PUNCH_IN";
    let isRunning = false;
    let onBreak = false;

    if (record && record.punchIn) {
      const lastBreak = record.breaks?.at(-1);
      onBreak = !!(lastBreak && !lastBreak.out);

      if (record.punchOut) {
        status = "COMPLETED";
        // Support multi-session punching: employees can punch in again after punch out
        nextAllowedAction = "PUNCH_IN";
        isRunning = false;
      } else if (onBreak) {
        status = "ON_BREAK";
        nextAllowedAction = "BREAK_OUT";
        isRunning = false;
      } else {
        status = "WORKING";
        nextAllowedAction = "PUNCH_OUT";
        isRunning = true;
      }
    }

    if (holiday) {
      status = "HOLIDAY";
      nextAllowedAction = "NONE";
    }

    return {
      id: u._id.toString(),
      name: u.name,
      role: u.role,
      designation: u.designation || "",
      profilePicture: u.profilePicture?.url || null,
      status,
      nextAllowedAction,
      punchIn: record?.punchIn || null,
      punchOut: record?.punchOut || null,
      workedSeconds: record ? calcLiveNetSeconds(record) : 0,
      isLateHalfDay: record?.attendanceStatus === "HALF_DAY",
    };
  });
};

/**
 * Retrieves the current day's live status for a single employee.
 */
export const getKioskEmployeeStatusService = async (employeeId, dateStr = null) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new AppError("Invalid employee ID format", 400);
  }

  const queryDate = dateStr ? parseISTDateOnly(dateStr) : todayISTUTC();

  const [user, record, holiday] = await Promise.all([
    User.findById(employeeId).select("name role designation profilePicture isActive").lean(),
    WorkRecord.findOne({ user: employeeId, date: queryDate }).lean(),
    Holiday.findOne({ date: queryDate }).lean(),
  ]);

  if (!user || !user.isActive) {
    throw new AppError("Employee not found or inactive", 404);
  }

  let status = "NOT_STARTED";
  let nextAllowedAction = "PUNCH_IN";
  let onBreak = false;

  if (record && record.punchIn) {
    const lastBreak = record.breaks?.at(-1);
    onBreak = !!(lastBreak && !lastBreak.out);

    if (record.punchOut) {
      status = "COMPLETED";
      nextAllowedAction = "PUNCH_IN";
    } else if (onBreak) {
      status = "ON_BREAK";
      nextAllowedAction = "BREAK_OUT";
    } else {
      status = "WORKING";
      nextAllowedAction = "PUNCH_OUT";
    }
  }

  if (holiday) {
    status = "HOLIDAY";
    nextAllowedAction = "NONE";
  }

  return {
    id: user._id.toString(),
    name: user.name,
    role: user.role,
    designation: user.designation || "",
    profilePicture: user.profilePicture?.url || null,
    status,
    nextAllowedAction,
    punchIn: record?.punchIn || null,
    punchOut: record?.punchOut || null,
    punches: record?.punches || [],
    workedSeconds: record ? calcLiveNetSeconds(record) : 0,
    isLateHalfDay: record?.attendanceStatus === "HALF_DAY",
  };
};

/**
 * Executes a kiosk Punch In on behalf of an employee.
 * Reuses existing punchInService to ensure 100% rule parity (10:30 AM cutoff, multi-session, holiday checks).
 */
export const kioskPunchInActionService = async ({ req, employeeId, deviceId }) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new AppError("Invalid employee ID format", 400);
  }

  const user = await User.findById(employeeId).select("name role isActive").lean();
  if (!user || !user.isActive) {
    throw new AppError("Employee not found or inactive", 404);
  }

  // Execute core attendance service
  const record = await punchInService(employeeId);

  // Write audit log entry
  try {
    await logActivity({
      req,
      user: { _id: user._id, name: user.name, role: user.role },
      category: "Attendance",
      module: "Kiosk",
      action: "KIOSK_PUNCH_IN",
      entityId: user._id,
      entityName: user.name,
      description: `${user.name} punched in via kiosk device ${deviceId}`,
      metadata: { deviceId, kioskTimestamp: new Date() },
    });
  } catch (logErr) {
    console.warn("Kiosk audit log non-fatal error:", logErr.message);
  }

  return {
    employeeId: user._id.toString(),
    name: user.name,
    punchIn: record.punchIn,
    status: record.attendanceStatus || "WORKING",
    isLateHalfDay: record.attendanceStatus === "HALF_DAY",
  };
};

/**
 * Executes a kiosk Punch Out on behalf of an employee.
 * Reuses existing punchOutService to ensure 100% rule parity (work calculation, half-day/present derivation, auto-close guard).
 */
export const kioskPunchOutActionService = async ({ req, employeeId, deviceId }) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new AppError("Invalid employee ID format", 400);
  }

  const user = await User.findById(employeeId).select("name role isActive").lean();
  if (!user || !user.isActive) {
    throw new AppError("Employee not found or inactive", 404);
  }

  // Execute core attendance service
  const record = await punchOutService(employeeId);

  // Write audit log entry
  try {
    await logActivity({
      req,
      user: { _id: user._id, name: user.name, role: user.role },
      category: "Attendance",
      module: "Kiosk",
      action: "KIOSK_PUNCH_OUT",
      entityId: user._id,
      entityName: user.name,
      description: `${user.name} punched out via kiosk device ${deviceId}`,
      metadata: { deviceId, kioskTimestamp: new Date() },
    });
  } catch (logErr) {
    console.warn("Kiosk audit log non-fatal error:", logErr.message);
  }

  return {
    employeeId: user._id.toString(),
    name: user.name,
    punchIn: record.punchIn,
    punchOut: record.punchOut,
    netWorkMinutes: record.netWorkMinutes,
    attendanceStatus: record.attendanceStatus,
  };
};

