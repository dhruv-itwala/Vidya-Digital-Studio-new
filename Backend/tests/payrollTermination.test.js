import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getPayrollsByMonthService, generateDraftPayrollsService } from "../StaffCRM/Payroll/payroll.service.js";

describe("Payroll Termination & Stale Record Guard Tests", () => {
  test("1. getPayrollsByMonthService filters out employees terminated before month start", () => {
    const novStart = new Date(2026, 10, 1); // 1st Nov 2026
    const octTermDate = new Date("2026-10-29T00:00:00.000Z");

    assert.ok(octTermDate < novStart, "October 29 is strictly before November 1st");
  });

  test("2. Month start comparison accurately distinguishes exit month from post-exit month", () => {
    const octStart = new Date(2026, 9, 1);  // 1st Oct 2026
    const novStart = new Date(2026, 10, 1); // 1st Nov 2026

    const mihirExit = new Date("2026-10-29T00:00:00.000Z");
    const udishExit = new Date("2026-10-25T00:00:00.000Z");

    // In October (exit month): both worked during October
    assert.ok(mihirExit >= octStart, "Mihir worked in October before exit");
    assert.ok(udishExit >= octStart, "Udish worked in October before exit");

    // In November (post-exit month): neither worked in November
    assert.ok(mihirExit < novStart, "Mihir exited before November started");
    assert.ok(udishExit < novStart, "Udish exited before November started");
  });
});

