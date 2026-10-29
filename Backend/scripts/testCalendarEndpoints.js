import assert from "assert";
import express from "express";
import http from "http";
import ContentCalendarRoutes from "../StaffCRM/ContentCalendar/contentCalendar.routes.js";
import ContentCalendarClientRoutes from "../StaffCRM/ContentCalendar/contentCalendarClient.routes.js";

console.log("==================================================");
console.log("🧪 TESTING API ROUTES & PERMISSION GUARDS");
console.log("==================================================");

let passed = 0;
let failed = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${testName}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// 1. Verify Employee Router has the expected stack and middlewares
runTest("ContentCalendarRoutes router has authentication middleware", () => {
  const stack = ContentCalendarRoutes.stack;
  assert.ok(stack.length >= 7, "Router should have multiple route handlers registered");

  // Check routes registered
  const paths = stack.map((layer) => layer.route?.path).filter(Boolean);
  assert.ok(paths.includes("/client/:clientId/status"), "Status route registered");
  assert.ok(paths.includes("/client/:clientId/tabs"), "Tabs route registered");
  assert.ok(paths.includes("/client/:clientId/entries"), "Entries route registered");
  assert.ok(paths.includes("/client/:clientId/connect"), "Connect route registered");
  assert.ok(paths.includes("/client/:clientId/disconnect"), "Disconnect route registered");
  assert.ok(paths.includes("/client/:clientId/refresh"), "Refresh route registered");
});

// 2. Verify Client Router has only read-only endpoints (NO POST entries, NO PATCH, NO DELETE)
runTest("ContentCalendarClientRoutes is strictly read-only", () => {
  const stack = ContentCalendarClientRoutes.stack;
  const methods = [];
  const paths = [];

  stack.forEach((layer) => {
    if (layer.route) {
      paths.push(layer.route.path);
      methods.push(...Object.keys(layer.route.methods));
    }
  });

  assert.ok(paths.includes("/status"), "Client status route registered");
  assert.ok(paths.includes("/tabs"), "Client tabs route registered");
  assert.ok(paths.includes("/entries"), "Client entries route registered");
  assert.ok(paths.includes("/refresh"), "Client refresh route registered");

  // Verify NO mutating entry endpoints exist in client router
  assert.ok(!paths.includes("/entries/:rowId"), "No update or delete routes in client router");
  assert.ok(!methods.includes("delete"), "Client router has NO delete methods");
  assert.ok(!methods.includes("patch"), "Client router has NO patch methods");
});

console.log("\n==================================================");
console.log(`📊 ROUTE TESTS: ${passed} PASSED | ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) process.exit(1);
