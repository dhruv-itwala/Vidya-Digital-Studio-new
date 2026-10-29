// Backend/StaffCRM/Kiosk/kiosk.controller.js
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import * as service from "./kiosk.service.js";
import KioskIdempotency from "./kioskIdempotency.model.js";

// In-memory fallback cache used in test environments when MongoDB is not connected
const memoryIdempotencyFallback = new Map();
const MEMORY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Validates client timestamp to detect extreme clock skew or unparseable formats.
 * Normal network jitter or small client offsets log telemetry warnings but DO NOT block punches,
 * since server time is the authoritative source for attendance records.
 */
export const validateClockDrift = (clientTimestamp, deviceId = "UNKNOWN") => {
  if (!clientTimestamp) return;

  const clientTime = new Date(clientTimestamp).getTime();
  if (isNaN(clientTime)) {
    throw new AppError("Invalid client timestamp format", 400);
  }

  const drift = Math.abs(Date.now() - clientTime);

  // Log telemetry warning for drift > 60 seconds
  if (drift > 60 * 1000) {
    console.warn(
      `[Kiosk Telemetry] Clock drift of ${Math.round(drift / 1000)}s observed from device ${deviceId}`,
    );
  }

  // Reject only on extreme drift (> 24 hours) indicating an unconfigured device clock
  const MAX_PERMISSIBLE_SKEW_MS = 24 * 60 * 60 * 1000;
  if (drift > MAX_PERMISSIBLE_SKEW_MS) {
    throw new AppError(
      "Kiosk device clock is skewed by more than 24 hours. Please synchronize date and time settings on the device.",
      400,
    );
  }
};

/**
 * Concurrency-safe, durable idempotency execution wrapper.
 * Coordinates punch requests using MongoDB KioskIdempotency unique index.
 */
export const executeIdempotentPunch = async ({
  idempotencyKey,
  deviceId,
  employeeId,
  action,
  actionFn,
}) => {
  if (!idempotencyKey) {
    return await actionFn();
  }

  const isDbConnected =
    mongoose.connection && mongoose.connection.readyState === 1;

  if (isDbConnected) {
    let idempotencyDoc;
    try {
      idempotencyDoc = await KioskIdempotency.create({
        key: idempotencyKey,
        deviceId,
        employeeId,
        action,
        status: "PROCESSING",
      });
    } catch (err) {
      if (err.code === 11000) {
        // Concurrency conflict / duplicate request
        const existing = await KioskIdempotency.findOne({
          key: idempotencyKey,
        });
        if (existing) {
          if (existing.status === "COMPLETED" && existing.responsePayload) {
            return existing.responsePayload;
          }
          if (existing.status === "PROCESSING") {
            throw new AppError(
              "An identical attendance request is currently being processed. Please wait a moment.",
              409,
            );
          }
          if (existing.status === "FAILED") {
            throw new AppError(
              existing.errorMessage ||
                "Previous attendance request with this key failed.",
              400,
            );
          }
        }
      }
      throw err;
    }

    try {
      const responseBody = await actionFn();
      await KioskIdempotency.updateOne(
        { _id: idempotencyDoc._id },
        {
          $set: {
            status: "COMPLETED",
            responsePayload: responseBody,
          },
        },
      );
      return responseBody;
    } catch (actionErr) {
      await KioskIdempotency.updateOne(
        { _id: idempotencyDoc._id },
        {
          $set: {
            status: "FAILED",
            errorMessage: actionErr.message,
          },
        },
      );
      throw actionErr;
    }
  } else {
    // In-memory fallback for test environments without live MongoDB
    if (memoryIdempotencyFallback.has(idempotencyKey)) {
      const cached = memoryIdempotencyFallback.get(idempotencyKey);
      if (cached.status === "COMPLETED") {
        return cached.responsePayload;
      }
      if (cached.status === "PROCESSING") {
        throw new AppError(
          "An identical attendance request is currently being processed. Please wait a moment.",
          409,
        );
      }
      if (cached.status === "FAILED") {
        throw new AppError(
          cached.errorMessage ||
            "Previous attendance request with this key failed.",
          400,
        );
      }
    }

    memoryIdempotencyFallback.set(idempotencyKey, {
      status: "PROCESSING",
      createdAt: Date.now(),
    });

    try {
      const responseBody = await actionFn();
      memoryIdempotencyFallback.set(idempotencyKey, {
        status: "COMPLETED",
        responsePayload: responseBody,
        createdAt: Date.now(),
      });
      return responseBody;
    } catch (actionErr) {
      memoryIdempotencyFallback.set(idempotencyKey, {
        status: "FAILED",
        errorMessage: actionErr.message,
        createdAt: Date.now(),
      });
      throw actionErr;
    }
  }
};

/**
 * GET /api/v1.0/kiosk/employees
 * Retrieves sanitized list of active employees and live attendance status
 */
export const getKioskEmployees = asyncHandler(async (req, res) => {
  const { search, date } = req.query;
  const employees = await service.getKioskEmployeesService(search, date);

  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    count: employees.length,
    data: employees,
  });
});

/**
 * GET /api/v1.0/kiosk/employees/:id/status
 * Retrieves live work and punch status for a specific employee
 */
export const getKioskEmployeeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  const status = await service.getKioskEmployeeStatusService(id, date);

  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    data: status,
  });
});

/**
 * POST /api/v1.0/kiosk/punch-in
 * Records a kiosk punch in with durable idempotency and audit logging
 */
export const kioskPunchIn = asyncHandler(async (req, res) => {
  const { employeeId, idempotencyKey, clientTimestamp } = req.body;
  const deviceId = req.kiosk?.deviceId || "UNKNOWN";

  if (!employeeId) {
    throw new AppError("employeeId is required", 400);
  }

  validateClockDrift(clientTimestamp, deviceId);

  const responseBody = await executeIdempotentPunch({
    idempotencyKey,
    deviceId,
    employeeId,
    action: "PUNCH_IN",
    actionFn: async () => {
      const result = await service.kioskPunchInActionService({
        req,
        employeeId,
        deviceId,
      });

      return {
        success: true,
        message: "Punch In recorded successfully",
        serverTime: new Date().toISOString(),
        data: result,
      };
    },
  });

  res.json(responseBody);
});

/**
 * POST /api/v1.0/kiosk/punch-out
 * Records a kiosk punch out with durable idempotency and audit logging
 */
export const kioskPunchOut = asyncHandler(async (req, res) => {
  const { employeeId, idempotencyKey, clientTimestamp } = req.body;
  const deviceId = req.kiosk?.deviceId || "UNKNOWN";

  if (!employeeId) {
    throw new AppError("employeeId is required", 400);
  }

  validateClockDrift(clientTimestamp, deviceId);

  const responseBody = await executeIdempotentPunch({
    idempotencyKey,
    deviceId,
    employeeId,
    action: "PUNCH_OUT",
    actionFn: async () => {
      const result = await service.kioskPunchOutActionService({
        req,
        employeeId,
        deviceId,
      });

      return {
        success: true,
        message: "Punch Out recorded successfully",
        serverTime: new Date().toISOString(),
        data: result,
      };
    },
  });

  res.json(responseBody);
});
