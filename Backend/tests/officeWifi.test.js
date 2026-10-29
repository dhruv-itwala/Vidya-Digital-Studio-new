// Backend/tests/officeWifi.test.js
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  getClientPublicIp,
  verifyOfficeWifi,
  verifyOfficeWifiAsync,
  requireOfficeWifi,
  invalidateOfficeWifiCache,
} from "../StaffCRM/middleware/officeWifi.middleware.js";

describe("Studio Wi-Fi & Office IP Verification Tests", () => {
  test("1. getClientPublicIp extracts primary IP from x-forwarded-for list", () => {
    const req = {
      headers: {
        "x-forwarded-for": "103.21.54.10, 192.168.1.1",
      },
    };
    assert.equal(getClientPublicIp(req), "103.21.54.10");
  });

  test("2. verifyOfficeWifi accepts client reporting office subnet (192.168.0.x)", () => {
    const req = {
      headers: {
        "x-client-local-ip": "192.168.0.149",
        "x-forwarded-for": "103.21.54.10",
      },
    };
    const result = verifyOfficeWifi(req);
    assert.equal(result.isOfficeWifi, true);
    assert.equal(result.clientLocalIp, "192.168.0.149");
  });

  test("3. verifyOfficeWifi matches configured public broadband IP", () => {
    const prev = process.env.OFFICE_WIFI_IPS;
    process.env.OFFICE_WIFI_IPS = "103.21.54.10, 122.161.45.10";

    const req = {
      headers: {
        "x-forwarded-for": "103.21.54.10",
      },
    };
    const result = verifyOfficeWifi(req);
    assert.equal(result.isOfficeWifi, true);

    process.env.OFFICE_WIFI_IPS = prev || "";
  });

  test("4. verifyOfficeWifi rejects outside mobile data (10.x.x.x, non-office public IP)", () => {
    const prevEnv = process.env.NODE_ENV;
    const prevIps = process.env.OFFICE_WIFI_IPS;

    process.env.NODE_ENV = "production";
    process.env.OFFICE_WIFI_IPS = "122.161.45.10";

    const req = {
      headers: {
        "x-client-local-ip": "10.45.67.89",
        "x-forwarded-for": "49.36.12.8",
      },
      socket: { remoteAddress: "49.36.12.8" },
    };

    const result = verifyOfficeWifi(req);
    assert.equal(result.isOfficeWifi, false);

    process.env.NODE_ENV = prevEnv;
    process.env.OFFICE_WIFI_IPS = prevIps || "";
  });

  test("5. requireOfficeWifi middleware calls next() when on Wi-Fi and passes error when outside", async () => {
    const prevEnv = process.env.NODE_ENV;
    const prev = process.env.OFFICE_WIFI_IPS;
    process.env.OFFICE_WIFI_IPS = "103.21.54.10";

    let nextCalled = false;
    let nextError = null;

    const allowedReq = {
      headers: { "x-forwarded-for": "103.21.54.10" },
    };

    await new Promise((resolve) => {
      requireOfficeWifi(allowedReq, {}, (err) => {
        if (err) nextError = err;
        else nextCalled = true;
        resolve();
      });
    });

    assert.equal(nextCalled, true);
    assert.equal(nextError, null);

    // Test rejection
    process.env.NODE_ENV = "production";
    process.env.OFFICE_WIFI_IPS = "103.21.54.10";
    let blockedCalled = false;
    let blockedError = null;
    const blockedReq = {
      headers: { "x-forwarded-for": "203.0.113.195" },
      socket: { remoteAddress: "203.0.113.195" },
    };

    await new Promise((resolve) => {
      requireOfficeWifi(blockedReq, {}, (err) => {
        if (err) blockedError = err;
        else blockedCalled = true;
        resolve();
      });
    });

    assert.equal(blockedCalled, false);
    assert.ok(blockedError, "Should throw AppError when unauthorized");
    assert.equal(blockedError.statusCode, 403);

    process.env.NODE_ENV = prevEnv;
    process.env.OFFICE_WIFI_IPS = prev || "";
  });

  test("6. invalidateOfficeWifiCache resets in-memory cache and verifyOfficeWifiAsync evaluates cleanly", async () => {
    invalidateOfficeWifiCache();
    const req = {
      headers: { "x-client-local-ip": "192.168.0.149" },
    };
    const res = await verifyOfficeWifiAsync(req);
    assert.equal(res.isOfficeWifi, true);
    assert.equal(res.clientLocalIp, "192.168.0.149");
  });

  test("7. requireOfficeWifi allows WFH / On-site employees (requireOfficeWifi: false or undefined) from any outside IP", async () => {
    process.env.NODE_ENV = "production";
    process.env.OFFICE_WIFI_IPS = "103.21.54.10";

    // Test with undefined (default state for existing employees)
    const defaultEmpReq = {
      user: {
        _id: "650000000000000000000001",
        name: "Default Employee",
        // requireOfficeWifi: undefined
      },
      headers: { "x-forwarded-for": "203.0.113.195" },
      socket: { remoteAddress: "203.0.113.195" },
    };

    let nextCalled = false;
    let nextError = null;

    await new Promise((resolve) => {
      requireOfficeWifi(defaultEmpReq, {}, (err) => {
        if (err) nextError = err;
        else nextCalled = true;
        resolve();
      });
    });

    assert.equal(nextCalled, true);
    assert.equal(nextError, null);
    assert.equal(defaultEmpReq.officeWifi.isExempt, true);

    // Test with requireOfficeWifi: true (office employee) - must be blocked outside
    const officeEmpReq = {
      user: {
        _id: "650000000000000000000002",
        name: "Office Employee",
        requireOfficeWifi: true,
      },
      headers: { "x-forwarded-for": "203.0.113.195" },
      socket: { remoteAddress: "203.0.113.195" },
    };

    let officeError = null;
    await new Promise((resolve) => {
      requireOfficeWifi(officeEmpReq, {}, (err) => {
        officeError = err;
        resolve();
      });
    });

    assert.ok(officeError, "Office-required employee must be blocked on outside network");
    assert.equal(officeError.statusCode, 403);
  });
});

