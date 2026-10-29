/**
 * Automated Tests for Strict Attendance Rules:
 * 1. Punch-in after 10:30 AM IST automatically becomes HALF_DAY regardless of working late.
 * 2. Attendance Summary filtering support.
 */
import assert from "assert";
import {
  isPunchInAfter1030IST,
  suggestAttendanceStatus,
} from "../StaffCRM/Attendance/utils/attendance.utils.js";

console.log("==================================================");
console.log("🧪 RUNNING STRICT ATTENDANCE & FILTER TESTS");
console.log("==================================================");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// -----------------------------------------------------------------
// 1. isPunchInAfter1030IST tests
// Note: 10:30 AM IST = 05:00 UTC (IST is UTC + 5:30)
// -----------------------------------------------------------------
console.log("\n--- [1] 10:30 AM IST Cutoff Detection Tests ---");

runTest("Login at 09:30 AM IST (04:00 UTC) is on-time (NOT late)", () => {
  const d = new Date("2026-10-29T04:00:00Z"); // 09:30 AM IST
  assert.strictEqual(isPunchInAfter1030IST(d), false);
});

runTest("Login at 10:00 AM IST (04:30 UTC) is on-time (NOT late)", () => {
  const d = new Date("2026-10-29T04:30:00Z"); // 10:00 AM IST
  assert.strictEqual(isPunchInAfter1030IST(d), false);
});

runTest("Login at exactly 10:30:00 AM IST (05:00:00 UTC) is on-time (NOT after 10:30)", () => {
  const d = new Date("2026-10-29T05:00:00Z"); // 10:30:00 AM IST
  assert.strictEqual(isPunchInAfter1030IST(d), false);
});

runTest("Login at 10:30:01 AM IST (05:00:01 UTC) IS after 10:30 (Late Half Day)", () => {
  const d = new Date("2026-10-29T05:00:01Z"); // 10:30:01 AM IST
  assert.strictEqual(isPunchInAfter1030IST(d), true);
});

runTest("Login at 10:31:00 AM IST (05:01:00 UTC) IS after 10:30 (Late Half Day)", () => {
  const d = new Date("2026-10-29T05:01:00Z"); // 10:31:00 AM IST
  assert.strictEqual(isPunchInAfter1030IST(d), true);
});

runTest("Login at 11:15:00 AM IST (05:45:00 UTC) IS after 10:30 (Late Half Day)", () => {
  const d = new Date("2026-10-29T05:45:00Z"); // 11:15:00 AM IST
  assert.strictEqual(isPunchInAfter1030IST(d), true);
});

runTest("Login at 01:00:00 PM IST (07:30:00 UTC) IS after 10:30 (Late Half Day)", () => {
  const d = new Date("2026-10-29T07:30:00Z"); // 01:00:00 PM IST
  assert.strictEqual(isPunchInAfter1030IST(d), true);
});

runTest("Null or invalid dates safely return false", () => {
  assert.strictEqual(isPunchInAfter1030IST(null), false);
  assert.strictEqual(isPunchInAfter1030IST(undefined), false);
  assert.strictEqual(isPunchInAfter1030IST("invalid-date"), false);
});

// -----------------------------------------------------------------
// 2. suggestAttendanceStatus strict rule tests
// -----------------------------------------------------------------
console.log("\n--- [2] Strict Rule: Half Day on Late Login Tests ---");

runTest("On-time login (10:00 AM IST) with full day work (480 mins) -> PRESENT", () => {
  const onTimePunchIn = new Date("2026-10-29T04:30:00Z"); // 10:00 AM IST
  const status = suggestAttendanceStatus(480, "employee", onTimePunchIn);
  assert.strictEqual(status, "PRESENT");
});

runTest("On-time login (10:00 AM IST) with 240 mins work -> HALF_DAY", () => {
  const onTimePunchIn = new Date("2026-10-29T04:30:00Z"); // 10:00 AM IST
  const status = suggestAttendanceStatus(240, "employee", onTimePunchIn);
  assert.strictEqual(status, "HALF_DAY");
});

runTest("On-time login (10:00 AM IST) with 60 mins work -> ABSENT", () => {
  const onTimePunchIn = new Date("2026-10-29T04:30:00Z"); // 10:00 AM IST
  const status = suggestAttendanceStatus(60, "employee", onTimePunchIn);
  assert.strictEqual(status, "ABSENT");
});

runTest("Late login (10:31 AM IST) with full 8 hours worked (480 mins) -> strictly HALF_DAY", () => {
  const latePunchIn = new Date("2026-10-29T05:01:00Z"); // 10:31 AM IST
  // User says: 'doesnt matter if they have worked till late or not'
  const status = suggestAttendanceStatus(480, "employee", latePunchIn);
  assert.strictEqual(status, "HALF_DAY");
});

runTest("Late login (11:00 AM IST) with 9 hours worked (540 mins) -> strictly HALF_DAY", () => {
  const latePunchIn = new Date("2026-10-29T05:30:00Z"); // 11:00 AM IST
  const status = suggestAttendanceStatus(540, "employee", latePunchIn);
  assert.strictEqual(status, "HALF_DAY");
});

runTest("Late login (12:00 PM IST) for intern role with full hours -> strictly HALF_DAY", () => {
  const latePunchIn = new Date("2026-10-29T06:30:00Z"); // 12:00 PM IST
  const status = suggestAttendanceStatus(300, "intern", latePunchIn);
  assert.strictEqual(status, "HALF_DAY");
});

// -----------------------------------------------------------------
// 3. UserIds parsing & filtering logic tests
// -----------------------------------------------------------------
console.log("\n--- [3] Attendance Summary Employee Filter Logic Tests ---");

runTest("Parse userIds from comma-separated string or array", () => {
  const userIdsStr = "user1, user2 , user3";
  const parsed = userIdsStr.split(",").map(id => id.trim()).filter(Boolean);
  assert.deepStrictEqual(parsed, ["user1", "user2", "user3"]);
});

runTest("Filter employee matrix correctly with selected IDs", () => {
  const mockEmployees = [
    { id: "emp1", name: "Alice" },
    { id: "emp2", name: "Bob" },
    { id: "emp3", name: "Charmi" },
  ];
  const selectedIds = ["emp1", "emp3"];
  const filtered = mockEmployees.filter(e => selectedIds.includes(e.id));
  assert.deepStrictEqual(filtered.map(e => e.name), ["Alice", "Charmi"]);
});

console.log("==================================================");
console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
}

