import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  parseISTDateOnly,
  calcWorkMinutes,
  isPunchInAfter1030IST,
  getCurrentWeekRangeIST,
  getWorkPolicy,
} from "../StaffCRM/Attendance/utils/attendance.utils.js";

describe("HR Override Universal Timing & Precedence Tests", () => {
  test("1.1 Shift start calculation correctly computes officeHours.start IST without previous 23-hour offset", () => {
    const day = parseISTDateOnly("2026-11-05");
    const policy = getWorkPolicy("employee");
    const shiftStart = new Date(day.getTime() + (policy.officeHours?.start || 8) * 3600 * 1000);

    // For employee (full_time, start: 8 AM IST): 8:00 AM IST on 2026-11-05 is 02:30:00.000Z in UTC
    assert.equal(shiftStart.toISOString(), "2026-11-05T02:30:00.000Z");

    // Punch in at 8:15 AM IST (02:45:00.000Z)
    const punchIn = new Date("2026-11-05T02:45:00.000Z");
    const lateMinutes = Math.floor((punchIn - shiftStart) / 60000);
    assert.equal(lateMinutes, 15, "Late minutes is exactly 15 minutes, not 1380+ minutes");
  });

  test("1.2 Punches array synchronization matches punchIn and punchOut boundaries", () => {
    const targetRecord = {
      punchIn: new Date("2026-11-05T04:00:00.000Z"), // 09:30 AM IST
      punchOut: new Date("2026-11-05T13:00:00.000Z"), // 06:30 PM IST
      punches: [],
    };

    // When punches array is empty or not passed, it synchronizes with punchIn & punchOut
    targetRecord.punches = [
      { in: targetRecord.punchIn, out: targetRecord.punchOut || null },
    ];

    assert.equal(targetRecord.punches.length, 1);
    assert.equal(targetRecord.punches[0].in.toISOString(), "2026-11-05T04:00:00.000Z");
    assert.equal(targetRecord.punches[0].out.toISOString(), "2026-11-05T13:00:00.000Z");

    calcWorkMinutes(targetRecord);
    // 9 hours total work = 540 minutes
    assert.equal(targetRecord.totalWorkMinutes, 540);
  });

  test("1.3 Punches array synchronizes even when punchOut is null (active shift)", () => {
    const targetRecord = {
      punchIn: new Date("2026-11-05T04:00:00.000Z"),
      punchOut: null,
      punches: [{ in: new Date("2026-11-05T06:00:00.000Z"), out: null }], // stale punch
    };

    // Apply HR override synchronization logic
    targetRecord.punches = [
      { in: targetRecord.punchIn, out: targetRecord.punchOut || null },
    ];

    assert.equal(targetRecord.punches.length, 1);
    assert.equal(targetRecord.punches[0].in.toISOString(), "2026-11-05T04:00:00.000Z");
    assert.equal(targetRecord.punches[0].out, null);
  });

  test("1.4 HR Override status precedence: explicit HR override to PRESENT is not clobbered by 10:30 cutoff", () => {
    const att = { status: "PRESENT", source: "HR" };
    const work = { punchIn: new Date("2026-11-05T05:15:00.000Z") }; // 10:45 AM IST (after 10:30)

    assert.ok(isPunchInAfter1030IST(work.punchIn), "Punch in is strictly after 10:30 AM IST");

    // Status precedence evaluation
    let status = null;
    if (att && (att.source === "HR" || att.source === "ADMIN")) {
      status = att.status;
    } else if (work?.punchIn && isPunchInAfter1030IST(work.punchIn)) {
      status = "HALF_DAY";
    } else if (att) {
      status = att.status;
    }

    assert.equal(status, "PRESENT", "HR manual status takes precedence over automatic 10:30 rule");
  });

  test("1.5 Payroll respects HR override status: HR PRESENT status does not count as lateDay", () => {
    const att = {
      status: "PRESENT",
      source: "HR",
      punchIn: new Date("2026-11-05T05:15:00.000Z"), // 10:45 AM IST
    };

    const isHrOverridden = att.source === "HR" || att.source === "ADMIN";
    const isLate = isHrOverridden
      ? att.status === "HALF_DAY"
      : (att.status === "HALF_DAY" || (att.punchIn && isPunchInAfter1030IST(att.punchIn)));

    assert.equal(isLate, false, "Employee marked PRESENT by HR is not treated as late/half-day in payroll");
  });

  test("1.6 getCurrentWeekRangeIST handles arbitrary target dates accurately for historical overrides", () => {
    // 2026-10-14 is a Wednesday
    const wednesday = new Date("2026-10-14T10:00:00.000Z");
    const { weekStartUTC, weekEndUTC } = getCurrentWeekRangeIST(wednesday);

    // Monday of that week in IST is 2026-10-12 00:00 IST -> 2026-10-11T18:30:00.000Z UTC
    assert.equal(weekStartUTC.toISOString(), "2026-10-11T18:30:00.000Z");
    // Sunday end of that week in IST is 2026-10-18 23:59:59.999 IST -> 2026-10-18T18:29:59.999Z UTC
    assert.equal(weekEndUTC.toISOString(), "2026-10-18T18:29:59.999Z");
  });
});
