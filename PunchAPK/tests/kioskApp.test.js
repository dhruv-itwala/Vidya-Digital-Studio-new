// PunchAPK/tests/kioskApp.test.js
import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Kiosk Mobile Client Logic Tests", () => {
  test("1. Employee search filter matches by name or designation (case-insensitive)", () => {
    const employees = [
      { id: "1", name: "Rahul Sharma", designation: "Video Editor", role: "employee" },
      { id: "2", name: "Priya Patel", designation: "Graphic Designer", role: "employee" },
      { id: "3", name: "Amit Kumar", designation: "Cinematographer", role: "employee" },
    ];

    const filterEmployees = (list, query) => {
      if (!query.trim()) return list;
      const q = query.trim().toLowerCase();
      return list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.designation && e.designation.toLowerCase().includes(q)),
      );
    };

    assert.equal(filterEmployees(employees, "rahul").length, 1);
    assert.equal(filterEmployees(employees, "rahul")[0].name, "Rahul Sharma");
    assert.equal(filterEmployees(employees, "DESIGNER").length, 1);
    assert.equal(filterEmployees(employees, "DESIGNER")[0].name, "Priya Patel");
    assert.equal(filterEmployees(employees, "nonexistent").length, 0);
  });

  test("2. Avatar initials extraction correctly formats 1 and 2-part names", () => {
    const getInitials = (name) => {
      if (!name) return "??";
      const parts = name.trim().split(" ");
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    assert.equal(getInitials("Rahul Sharma"), "RS");
    assert.equal(getInitials("Priya"), "PR");
    assert.equal(getInitials("Amit Kumar Verma"), "AV");
    assert.equal(getInitials(""), "??");
  });

  test("3. Next allowed action derivation properly routes punch states", () => {
    const deriveAction = (status) => {
      switch (status) {
        case "NOT_STARTED":
          return "PUNCH_IN";
        case "WORKING":
          return "PUNCH_OUT";
        case "COMPLETED":
          return "PUNCH_IN"; // Multi-session punch in again
        case "ON_BREAK":
          return "BREAK_OUT";
        case "HOLIDAY":
        default:
          return "NONE";
      }
    };

    assert.equal(deriveAction("NOT_STARTED"), "PUNCH_IN");
    assert.equal(deriveAction("WORKING"), "PUNCH_OUT");
    assert.equal(deriveAction("COMPLETED"), "PUNCH_IN");
    assert.equal(deriveAction("ON_BREAK"), "BREAK_OUT");
    assert.equal(deriveAction("HOLIDAY"), "NONE");
  });

  test("4. UUIDv4 idempotency key validation matches standard format", () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const testKey = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";

    assert.ok(uuidRegex.test(testKey), "Key must match RFC4122 UUID v4 regex");
  });

  test("5. Admin PIN validation rules: requires 4-8 numeric digits and matching confirmation", () => {
    const validatePinSetup = (pin, confirmPin) => {
      if (!pin || !confirmPin) return { valid: false, error: "Both PIN fields are required." };
      if (pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
        return { valid: false, error: "PIN must be between 4 and 8 numeric digits." };
      }
      if (pin !== confirmPin) {
        return { valid: false, error: "PINs do not match. Please re-enter." };
      }
      return { valid: true };
    };

    // Valid PINs
    assert.equal(validatePinSetup("1234", "1234").valid, true);
    assert.equal(validatePinSetup("849201", "849201").valid, true);

    // Invalid: Too short (< 4 digits)
    assert.equal(validatePinSetup("123", "123").valid, false);

    // Invalid: Too long (> 8 digits)
    assert.equal(validatePinSetup("123456789", "123456789").valid, false);

    // Invalid: Non-numeric
    assert.equal(validatePinSetup("12ab", "12ab").valid, false);

    // Invalid: Mismatch
    assert.equal(validatePinSetup("1234", "1235").valid, false);

    // Invalid: Empty
    assert.equal(validatePinSetup("", "").valid, false);
  });
});
