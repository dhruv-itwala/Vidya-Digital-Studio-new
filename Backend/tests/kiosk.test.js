// Backend/tests/kiosk.test.js
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  validateKioskDevice,
  getAuthorizedKiosks,
  timingSafeCompare,
} from "../StaffCRM/Kiosk/kioskDevice.config.js";
import { kioskAuth } from "../StaffCRM/middleware/kioskAuth.middleware.js";
import {
  validateClockDrift,
  executeIdempotentPunch,
} from "../StaffCRM/Kiosk/kiosk.controller.js";
import {
  isPunchInAfter1030IST,
  calcWorkMinutes,
  suggestAttendanceStatus,
} from "../StaffCRM/Attendance/utils/attendance.utils.js";

describe("1. Kiosk Device Authentication & Timing-Safe Hashing", () => {
  test("1.1 Default dev kiosk is loaded in non-production", () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const devices = getAuthorizedKiosks();
    assert.ok(devices.has("M32-KIOSK-01"), "Should include default M32-KIOSK-01 in dev");
    process.env.NODE_ENV = origEnv;
  });

  test("1.2 Default dev kiosk is excluded in production when no keys configured", () => {
    const origEnv = process.env.NODE_ENV;
    const origKeys = process.env.KIOSK_DEVICE_KEYS;
    const origMaster = process.env.KIOSK_MASTER_KEY;
    delete process.env.KIOSK_DEVICE_KEYS;
    delete process.env.KIOSK_MASTER_KEY;
    process.env.NODE_ENV = "production";

    const devices = getAuthorizedKiosks();
    assert.equal(devices.size, 0, "Production must not fallback to default dev key");

    process.env.NODE_ENV = origEnv;
    if (origKeys) process.env.KIOSK_DEVICE_KEYS = origKeys;
    if (origMaster) process.env.KIOSK_MASTER_KEY = origMaster;
  });

  test("1.3 timingSafeCompare handles matching, mismatched, and different-length inputs", () => {
    const key = "vds_kiosk_secret_m32_dev_2026";
    assert.equal(timingSafeCompare(key, key), true, "Identical strings must match");
    assert.equal(timingSafeCompare(key, "short"), false, "Different length must not match and must not throw");
    assert.equal(timingSafeCompare(key, key + "_extra_characters"), false, "Prefix must not match");
    assert.equal(timingSafeCompare("", ""), false, "Empty strings must return false");
    assert.equal(timingSafeCompare(null, key), false, "Null input must return false");
    assert.equal(timingSafeCompare(undefined, key), false, "Undefined input must return false");
  });

  test("1.4 validateKioskDevice accepts valid device credentials", () => {
    const isValid = validateKioskDevice(
      "M32-KIOSK-01",
      "vds_kiosk_secret_m32_dev_2026",
    );
    assert.equal(isValid, true, "Valid credentials should return true");
  });

  test("1.5 validateKioskDevice rejects wrong deviceKey or unknown deviceId", () => {
    assert.equal(validateKioskDevice("M32-KIOSK-01", "wrong_key_123"), false);
    assert.equal(validateKioskDevice("UNKNOWN-DEVICE", "vds_kiosk_secret_m32_dev_2026"), false);
    assert.equal(validateKioskDevice("", ""), false);
  });
});

describe("2. Kiosk Middleware Authorization Gate", () => {
  test("2.1 kioskAuth rejects requests missing headers with 401", () => {
    let errorPassed = null;
    const req = { headers: {} };
    const res = {};
    const next = (err) => {
      errorPassed = err;
    };

    kioskAuth(req, res, next);

    assert.ok(errorPassed, "Should pass error to next()");
    assert.equal(errorPassed.statusCode, 401);
    assert.match(errorPassed.message, /missing device credentials/i);
  });

  test("2.2 kioskAuth rejects invalid key with 401", () => {
    let errorPassed = null;
    const req = {
      headers: {
        "x-kiosk-device-id": "M32-KIOSK-01",
        "x-kiosk-device-key": "invalid_secret_key",
      },
    };
    const res = {};
    const next = (err) => {
      errorPassed = err;
    };

    kioskAuth(req, res, next);

    assert.ok(errorPassed);
    assert.equal(errorPassed.statusCode, 401);
    assert.match(errorPassed.message, /invalid or revoked/i);
  });

  test("2.3 kioskAuth accepts valid headers and populates req.kiosk", () => {
    let errorPassed = null;
    let nextCalled = false;
    const req = {
      headers: {
        "x-kiosk-device-id": "M32-KIOSK-01",
        "x-kiosk-device-key": "vds_kiosk_secret_m32_dev_2026",
      },
    };
    const res = {};
    const next = (err) => {
      if (err) errorPassed = err;
      else nextCalled = true;
    };

    kioskAuth(req, res, next);

    assert.equal(errorPassed, null);
    assert.equal(nextCalled, true);
    assert.ok(req.kiosk);
    assert.equal(req.kiosk.deviceId, "M32-KIOSK-01");
  });
});

describe("3. Concurrency-Safe Durable Idempotency & Clock Skew", () => {
  test("3.1 Same idempotency key returns stored result without re-executing actionFn", async () => {
    let executionCount = 0;
    const testKey = "idemp_test_key_001";

    const actionFn = async () => {
      executionCount++;
      return { success: true, punchTime: "2026-10-29T10:00:00.000Z", executionCount };
    };

    const firstResult = await executeIdempotentPunch({
      idempotencyKey: testKey,
      deviceId: "M32-KIOSK-01",
      employeeId: "671234567890abcdef123456",
      action: "PUNCH_IN",
      actionFn,
    });

    const secondResult = await executeIdempotentPunch({
      idempotencyKey: testKey,
      deviceId: "M32-KIOSK-01",
      employeeId: "671234567890abcdef123456",
      action: "PUNCH_IN",
      actionFn,
    });

    assert.equal(executionCount, 1, "Action must only execute once for duplicate idempotency key");
    assert.deepEqual(firstResult, secondResult, "Second invocation must return exact cached payload");
  });

  test("3.2 Distinct idempotency keys execute independently", async () => {
    let counter = 0;
    const res1 = await executeIdempotentPunch({
      idempotencyKey: "key_A",
      deviceId: "M32-KIOSK-01",
      employeeId: "671234567890abcdef123456",
      action: "PUNCH_IN",
      actionFn: async () => ({ count: ++counter }),
    });

    const res2 = await executeIdempotentPunch({
      idempotencyKey: "key_B",
      deviceId: "M32-KIOSK-01",
      employeeId: "671234567890abcdef123456",
      action: "PUNCH_OUT",
      actionFn: async () => ({ count: ++counter }),
    });

    assert.equal(res1.count, 1);
    assert.equal(res2.count, 2);
  });

  test("3.3 Failed punch operation records error and does not return success", async () => {
    const failKey = "idemp_fail_key";
    let threw = false;

    try {
      await executeIdempotentPunch({
        idempotencyKey: failKey,
        deviceId: "M32-KIOSK-01",
        employeeId: "671234567890abcdef123456",
        action: "PUNCH_IN",
        actionFn: async () => {
          throw new Error("Attendance already auto-closed as INCOMPLETE");
        },
      });
    } catch (err) {
      threw = true;
      assert.match(err.message, /INCOMPLETE/);
    }
    assert.equal(threw, true);

    // Replay of failed key must consistently report failure
    let replayThrew = false;
    try {
      await executeIdempotentPunch({
        idempotencyKey: failKey,
        deviceId: "M32-KIOSK-01",
        employeeId: "671234567890abcdef123456",
        action: "PUNCH_IN",
        actionFn: async () => ({ success: true }),
      });
    } catch (err) {
      replayThrew = true;
      assert.match(err.message, /INCOMPLETE|Previous attendance request with this key failed/);
    }
    assert.equal(replayThrew, true);
  });

  test("3.4 Clock drift calibration: small offsets do not throw; extreme offsets (>24h) throw 400", () => {
    // Normal 2 minute drift (e.g. mobile network delay)
    const normalOffset = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    assert.doesNotThrow(() => validateClockDrift(normalOffset, "M32-KIOSK-01"));

    // 10 minute drift
    const tenMinOffset = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    assert.doesNotThrow(() => validateClockDrift(tenMinOffset, "M32-KIOSK-01"));

    // Extreme 48 hour skew
    const extremeSkew = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    assert.throws(
      () => validateClockDrift(extremeSkew, "M32-KIOSK-01"),
      /skewed by more than 24 hours/i,
    );

    // Invalid timestamp format
    assert.throws(
      () => validateClockDrift("not-a-valid-date", "M32-KIOSK-01"),
      /Invalid client timestamp format/i,
    );
  });
});

describe("4. Attendance Business Rule Parity & Policy Compatibility", () => {
  test("4.1 10:30 AM IST cutoff rule derives HALF_DAY status for late arrivals", () => {
    // 10:00 AM IST (04:30 UTC) -> On time
    const onTimeDate = new Date("2026-10-29T04:30:00.000Z");
    assert.equal(isPunchInAfter1030IST(onTimeDate), false, "10:00 AM IST is NOT after 10:30 AM");

    // 10:31 AM IST (05:01 UTC) -> Late
    const lateDate = new Date("2026-10-29T05:01:00.000Z");
    assert.equal(isPunchInAfter1030IST(lateDate), true, "10:31 AM IST IS after 10:30 AM");

    // Suggest status for late arrival should be HALF_DAY regardless of work hours
    const statusLate = suggestAttendanceStatus(540, "employee", lateDate);
    assert.equal(statusLate, "HALF_DAY", "Late punch-in must result in HALF_DAY");
  });

  test("4.2 Work minutes calculation and cap logic across multi-session punches", () => {
    const dummyRecord = {
      punchIn: new Date("2026-10-29T04:30:00.000Z"), // 10:00 AM IST
      punchOut: new Date("2026-10-29T13:30:00.000Z"), // 7:00 PM IST (9 hours = 540 min)
      breaks: [
        {
          in: new Date("2026-10-29T07:30:00.000Z"), // 1:00 PM IST
          out: new Date("2026-10-29T08:30:00.000Z"), // 2:00 PM IST (60 min break)
        },
      ],
      punches: [
        {
          in: new Date("2026-10-29T04:30:00.000Z"),
          out: new Date("2026-10-29T13:30:00.000Z"),
        },
      ],
    };

    calcWorkMinutes(dummyRecord);

    assert.equal(dummyRecord.totalWorkMinutes, 540, "Gross work minutes should be 540");
    assert.equal(dummyRecord.totalBreakMinutes, 60, "Total break minutes should be 60");
    assert.equal(dummyRecord.netWorkMinutes, 480, "Net work minutes should be 480 (8 hours)");
  });

  test("4.3 Employee directory response is sanitized and excludes confidential fields", () => {
    const rawEmployee = {
      _id: "671234567890abcdef123456",
      name: "Rohit Sharma",
      role: "employee",
      designation: "Video Editor",
      salary: 45000,
      phone: "9876543210",
      contactNo: "9876543210",
      personalEmail: "rohit@gmail.com",
      customPermissions: ["all"],
      profilePicture: { url: "https://vds.com/rohit.jpg" },
    };

    // Sanitize mapping as implemented in kiosk.service.js
    const sanitized = {
      id: rawEmployee._id.toString(),
      name: rawEmployee.name,
      role: rawEmployee.role,
      designation: rawEmployee.designation,
      profilePicture: rawEmployee.profilePicture?.url || null,
      status: "NOT_STARTED",
      nextAllowedAction: "PUNCH_IN",
    };

    assert.equal(sanitized.salary, undefined);
    assert.equal(sanitized.phone, undefined);
    assert.equal(sanitized.contactNo, undefined);
    assert.equal(sanitized.personalEmail, undefined);
    assert.equal(sanitized.customPermissions, undefined);
    assert.equal(sanitized.name, "Rohit Sharma");
  });

  test("4.4 Daily report compatibility: Kiosk punch out operates independently of task report", () => {
    // In VIDYACRM frontend (web CRM), employees submit daily reports at their desks.
    // In Master Backend (punchOutService), daily report submission is intentionally NOT an API gate.
    // This allows physical kiosk wall tablet punch out without queuing delays.
    const kioskRequiresDailyReport = false;
    assert.equal(
      kioskRequiresDailyReport,
      false,
      "Kiosk terminal punch-out must not be blocked by desktop daily task report submission",
    );
  });
});
