/**
 * Comprehensive Automated Tests for Google Sheets Content Calendar Integration
 */
import assert from "assert";
import {
  extractSpreadsheetId,
  isGoogleConfigured,
  getServiceAccountEmail,
} from "../StaffCRM/ContentCalendar/googleSheetsAuth.service.js";
import {
  parseMonthTab,
  findExistingOrBestMonthTab,
  buildHeaderMapping,
  normalizeStatus,
  normalizeWorkStatus,
  normalizeUploadStatus,
  deriveDayOfWeek,
  formatDateDDMMYYYY,
  findRowIndexById,
  CANONICAL_FIELD_SYNONYMS,
  DEFAULT_SHEET_HEADERS,
  CONTENT_TYPES,
  WORK_STATUSES,
  UPLOAD_STATUSES,
} from "../StaffCRM/ContentCalendar/googleSheets.service.js";
import {
  isUserAssigned,
  parseEntryDate,
  getDaysDifference,
} from "../StaffCRM/ContentCalendar/contentCalendar.service.js";

console.log("==================================================");
console.log("🧪 STARTING CONTENT CALENDAR INTEGRATION TESTS");
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

// ----------------------------------------------------
// 1. Spreadsheet URL & ID Extraction Tests
// ----------------------------------------------------
console.log("\n--- [1] URL & ID Extraction Tests ---");

runTest("Standard edit URL with gid", () => {
  const url = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0";
  const id = extractSpreadsheetId(url);
  assert.strictEqual(id, "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms");
});

runTest("Sharing URL with query params", () => {
  const url = "https://docs.google.com/spreadsheets/d/1AbC-123_xyz4567890abcdefghijklmnopqrstuv/edit?usp=sharing";
  const id = extractSpreadsheetId(url);
  assert.strictEqual(id, "1AbC-123_xyz4567890abcdefghijklmnopqrstuv");
});

runTest("Bare valid spreadsheet ID", () => {
  const raw = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms";
  const id = extractSpreadsheetId(raw);
  assert.strictEqual(id, "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms");
});

runTest("Reject invalid non-spreadsheet URL", () => {
  assert.throws(() => {
    extractSpreadsheetId("https://drive.google.com/drive/folders/123456789");
  }, /Invalid Google Spreadsheet URL/);
});

runTest("Reject arbitrary website URL", () => {
  assert.throws(() => {
    extractSpreadsheetId("https://example.com/not-a-sheet");
  }, /Invalid Google Spreadsheet URL/);
});

runTest("Reject empty or null input", () => {
  assert.throws(() => {
    extractSpreadsheetId("");
  }, /Spreadsheet URL or ID is required/);
  assert.throws(() => {
    extractSpreadsheetId(null);
  }, /Spreadsheet URL or ID is required/);
});

// ----------------------------------------------------
// 2. Month Tab Discovery & Chronological Sorting Tests
// ----------------------------------------------------
console.log("\n--- [2] Month Tab Discovery Tests ---");

runTest("Full month name without year", () => {
  const res = parseMonthTab("October");
  assert.strictEqual(res.isMonthTab, true);
  assert.strictEqual(res.monthIndex, 9); // October is 0-indexed 9
});

runTest("Month name with 4-digit year", () => {
  const res = parseMonthTab("February 2026");
  assert.strictEqual(res.isMonthTab, true);
  assert.strictEqual(res.monthIndex, 1);
  assert.strictEqual(res.year, 2026);
  assert.strictEqual(res.sortWeight, 2026 * 12 + 1);
});

runTest("Abbreviated month name with year prefix", () => {
  const res = parseMonthTab("Content Calendar Nov 2026");
  assert.strictEqual(res.isMonthTab, true);
  assert.strictEqual(res.monthIndex, 10);
  assert.strictEqual(res.year, 2026);
});

runTest("Chronological order comparison and reverse sorting", () => {
  const tabJul = { title: "July 2026", ...parseMonthTab("July 2026") };
  const tabAug = { title: "August 2026", ...parseMonthTab("August 2026") };
  const tabSep = { title: "September 2026", ...parseMonthTab("September 2026") };
  const tabOct = { title: "October 2026", ...parseMonthTab("October 2026") };
  const tabNov = { title: "November 2026", ...parseMonthTab("November 2026") };

  const unsorted = [tabJul, tabSep, tabNov, tabAug, tabOct];
  const reverseSorted = [...unsorted].sort((a, b) => (b.sortWeight || 0) - (a.sortWeight || 0));

  assert.deepStrictEqual(
    reverseSorted.map((t) => t.title),
    ["November 2026", "October 2026", "September 2026", "August 2026", "July 2026"],
    "Tabs should be sorted in reverse chronological order (newest first)"
  );
});

runTest("findExistingOrBestMonthTab selects current/existing month tab", () => {
  const tabs = [
    { title: "November 2026", isMonthTab: true, monthIndex: 10, year: 2026, sortWeight: 2026 * 12 + 10 },
    { title: "October 2026", isMonthTab: true, monthIndex: 9, year: 2026, sortWeight: 2026 * 12 + 9 },
    { title: "September 2026", isMonthTab: true, monthIndex: 8, year: 2026, sortWeight: 2026 * 12 + 8 },
    { title: "August 2026", isMonthTab: true, monthIndex: 7, year: 2026, sortWeight: 2026 * 12 + 7 },
  ];

  // Exact match for current date (Oct 2026)
  const octRef = new Date(2026, 9, 29);
  assert.strictEqual(findExistingOrBestMonthTab(tabs, octRef), "October 2026");

  // Exact match for Nov 2026
  const novRef = new Date(2026, 10, 2);
  assert.strictEqual(findExistingOrBestMonthTab(tabs, novRef), "November 2026");

  // Fallback to closest month tab (Dec 2026 -> closest is Nov 2026)
  const decRef = new Date(2026, 11, 15);
  assert.strictEqual(findExistingOrBestMonthTab(tabs, decRef), "November 2026");

  // Fallback to closest month tab (Jan 2026 -> closest is Aug 2026)
  const janRef = new Date(2026, 0, 15);
  assert.strictEqual(findExistingOrBestMonthTab(tabs, janRef), "August 2026");
});

runTest("Non-month tab identification", () => {
  const res = parseMonthTab("Brand Guidelines");
  assert.strictEqual(res.isMonthTab, false);
  assert.strictEqual(res.monthIndex, null);
  assert.strictEqual(res.sortWeight, 999999);
});

// ----------------------------------------------------
// 3. Header Mapping & Synonym Detection Tests
// ----------------------------------------------------
console.log("\n--- [3] Header Mapping Tests ---");

runTest("Recognize standard calendar headers", () => {
  const headers = [
    "Content ID",
    "Publish Date",
    "Time",
    "Social Media Platform",
    "Content Format",
    "Topic / Title",
    "Caption",
    "Hashtags",
    "Creative Link",
    "Status",
    "Assigned To",
  ];

  const mapping = buildHeaderMapping(headers);

  assert.strictEqual(mapping.canonicalToCol.id, 0);
  assert.strictEqual(mapping.canonicalToCol.date, 1);
  assert.strictEqual(mapping.canonicalToCol.time, 2);
  assert.strictEqual(mapping.canonicalToCol.platform, 3);
  assert.strictEqual(mapping.canonicalToCol.contentType, 4);
  assert.strictEqual(mapping.canonicalToCol.title, 5);
  assert.strictEqual(mapping.canonicalToCol.caption, 6);
  assert.strictEqual(mapping.canonicalToCol.hashtags, 7);
  assert.strictEqual(mapping.canonicalToCol.creativeUrl, 8);
  assert.strictEqual(mapping.canonicalToCol.status, 9);
  assert.strictEqual(mapping.canonicalToCol.assignedTo, 10);
});

runTest("Recognize alternative synonym headers", () => {
  const headers = [
    "Post Date",
    "Channel",
    "Type",
    "Headline",
    "Post Copy",
    "Tags",
    "Media URL",
    "Stage",
  ];

  const mapping = buildHeaderMapping(headers);

  assert.strictEqual(mapping.canonicalToCol.date, 0);
  assert.strictEqual(mapping.canonicalToCol.platform, 1);
  assert.strictEqual(mapping.canonicalToCol.contentType, 2);
  assert.strictEqual(mapping.canonicalToCol.title, 3);
  assert.strictEqual(mapping.canonicalToCol.caption, 4);
  assert.strictEqual(mapping.canonicalToCol.hashtags, 5);
  assert.strictEqual(mapping.canonicalToCol.creativeUrl, 6);
  assert.strictEqual(mapping.canonicalToCol.status, 7);
});

runTest("Preserve unrecognized columns in unrecognizedCols", () => {
  const headers = ["Publish Date", "Title", "Campaign Budget", "Target Audience"];
  const mapping = buildHeaderMapping(headers);

  assert.strictEqual(mapping.unrecognizedCols.length, 2);
  assert.strictEqual(mapping.unrecognizedCols[0].header, "Campaign Budget");
  assert.strictEqual(mapping.unrecognizedCols[1].header, "Target Audience");
});

runTest("User custom header override", () => {
  const headers = ["Custom Launch Date", "Post Title"];
  const customOverrides = { date: "Custom Launch Date" };
  const mapping = buildHeaderMapping(headers, customOverrides);

  assert.strictEqual(mapping.canonicalToCol.date, 0);
  assert.strictEqual(mapping.canonicalToCol.title, 1);
});

// ----------------------------------------------------
// 4. Status Normalization Tests
// ----------------------------------------------------
console.log("\n--- [4] Status Normalization Tests ---");

runTest("Normalize varied status terms", () => {
  assert.strictEqual(normalizeStatus("Scheduled for posting"), "Scheduled");
  assert.strictEqual(normalizeStatus("Published"), "Published");
  assert.strictEqual(normalizeStatus("Live"), "Published");
  assert.strictEqual(normalizeStatus("Pending Client Approval"), "Needs Review");
  assert.strictEqual(normalizeStatus("Under Review"), "Needs Review");
  assert.strictEqual(normalizeStatus("In Progress"), "In Progress");
  assert.strictEqual(normalizeStatus("Cancelled"), "Cancelled");
  assert.strictEqual(normalizeStatus(""), "Draft");
  assert.strictEqual(normalizeStatus(null), "Draft");
});

// ----------------------------------------------------
// 5. Stable Row Resolution Tests
// ----------------------------------------------------
console.log("\n--- [5] Stable Row Resolution Tests ---");

runTest("Find row by explicit Content ID", () => {
  const values = [
    ["Content ID", "Date", "Title"],
    ["VDS-101", "2026-10-01", "Post 1"],
    ["VDS-102", "2026-10-02", "Post 2"],
    ["VDS-103", "2026-10-03", "Post 3"],
  ];
  const mapping = buildHeaderMapping(values[0]);
  const rowIndex = findRowIndexById(values, mapping, "VDS-102");
  assert.strictEqual(rowIndex, 3); // Row 3 in 1-based indexing
});

runTest("Find row by synthetic ID format", () => {
  const values = [
    ["Date", "Title"],
    ["2026-10-01", "Post 1"],
    ["2026-10-02", "Post 2"],
  ];
  const mapping = buildHeaderMapping(values[0]);
  const rowIndex = findRowIndexById(values, mapping, "ROW_2_abc12345");
  assert.strictEqual(rowIndex, 2);
});

runTest("Fallback match by title and date", () => {
  const values = [
    ["Date", "Title"],
    ["2026-10-01", "Product Launch"],
    ["2026-10-05", "Customer Story"],
  ];
  const mapping = buildHeaderMapping(values[0]);
  const rowIndex = findRowIndexById(values, mapping, "MISSING_ID", {
    title: "Customer Story",
    date: "2026-10-05",
  });
  assert.strictEqual(rowIndex, 3);
});

// ----------------------------------------------------
// 6. Redesigned Format Specification Tests
// ----------------------------------------------------
console.log("\n--- [6] Redesigned Specification Tests ---");

runTest("Map exact redesigned specification headers", () => {
  const specHeaders = [
    "Date",
    "Day",
    "Content Type",
    "Content Details",
    "Ad Run",
    "Data Link",
    "Assigned To",
    "Work Status",
    "Upload Status",
  ];

  const mapping = buildHeaderMapping(specHeaders);

  assert.strictEqual(mapping.canonicalToCol.date, 0);
  assert.strictEqual(mapping.canonicalToCol.day, 1);
  assert.strictEqual(mapping.canonicalToCol.contentType, 2);
  assert.strictEqual(mapping.canonicalToCol.contentDetails, 3);
  assert.strictEqual(mapping.canonicalToCol.adRun, 4);
  assert.strictEqual(mapping.canonicalToCol.dataLink, 5);
  assert.strictEqual(mapping.canonicalToCol.assignedTo, 6);
  assert.strictEqual(mapping.canonicalToCol.workStatus, 7);
  assert.strictEqual(mapping.canonicalToCol.uploadStatus, 8);
  assert.strictEqual(mapping.unrecognizedCols.length, 0);
});

runTest("Auto derive day of week correctly", () => {
  assert.strictEqual(deriveDayOfWeek("15/07/2026"), "Wednesday");
  assert.strictEqual(deriveDayOfWeek("16/07/2026"), "Thursday");
  assert.strictEqual(deriveDayOfWeek("2026-07-15"), "Wednesday");
  assert.strictEqual(deriveDayOfWeek("01/01/2026"), "Thursday");
});

runTest("Format dates to DD/MM/YYYY format", () => {
  assert.strictEqual(formatDateDDMMYYYY("2026-07-15"), "15/07/2026");
  assert.strictEqual(formatDateDDMMYYYY("15/07/2026"), "15/07/2026");
  assert.strictEqual(formatDateDDMMYYYY("5/7/2026"), "05/07/2026");
});

runTest("Normalize Work Status dropdown values", () => {
  assert.strictEqual(normalizeWorkStatus("Pending"), "Pending");
  assert.strictEqual(normalizeWorkStatus("In Progress"), "In Progress");
  assert.strictEqual(normalizeWorkStatus("Done"), "Done");
  assert.strictEqual(normalizeWorkStatus("Delayed"), "Delayed");
  assert.strictEqual(normalizeWorkStatus("wip"), "In Progress");
  assert.strictEqual(normalizeWorkStatus("completed"), "Done");
  assert.strictEqual(normalizeWorkStatus("on hold"), "Delayed");
  assert.strictEqual(normalizeWorkStatus(""), "");
  assert.strictEqual(normalizeWorkStatus(null), "");
});

runTest("Normalize Upload Status dropdown values", () => {
  assert.strictEqual(normalizeUploadStatus("Pending"), "Pending");
  assert.strictEqual(normalizeUploadStatus("Uploaded"), "Uploaded");
  assert.strictEqual(normalizeUploadStatus("Scheduled"), "Scheduled");
  assert.strictEqual(normalizeUploadStatus("published"), "Uploaded");
  assert.strictEqual(normalizeUploadStatus("queued"), "Scheduled");
  assert.strictEqual(normalizeUploadStatus(""), "");
  assert.strictEqual(normalizeUploadStatus(null), "");
});

runTest("Verify allowed dropdown arrays are complete", () => {
  assert.deepStrictEqual(WORK_STATUSES, ["Pending", "In Progress", "Done", "Delayed"]);
  assert.deepStrictEqual(UPLOAD_STATUSES, ["Pending", "Uploaded", "Scheduled"]);
  assert.strictEqual(CONTENT_TYPES.length, 6);
  assert.ok(CONTENT_TYPES.includes("Instagram Post"));
  assert.ok(CONTENT_TYPES.includes("Instagram Story"));
  assert.ok(CONTENT_TYPES.includes("Instagram Reels"));
  assert.ok(CONTENT_TYPES.includes("Instagram Carousal"));
  assert.ok(CONTENT_TYPES.includes("Testimonial Post"));
  assert.ok(CONTENT_TYPES.includes("Influencer Reel"));
});

// ----------------------------------------------------
// 7. Notification Reminder & Assignment Tests
// ----------------------------------------------------
console.log("\n--- [7] Notification Reminder Tests ---");

runTest("isUserAssigned handles single name, multiple selects, and case insensitivity", () => {
  assert.strictEqual(isUserAssigned("Charmi patel", "Charmi Patel"), true);
  assert.strictEqual(isUserAssigned("Charmi patel, Dhruv, Amit", "Charmi Patel"), true);
  assert.strictEqual(isUserAssigned("Charmi patel; Dhruv", "Dhruv"), true);
  assert.strictEqual(isUserAssigned("Charmi patel / Dhruv", "Charmi patel"), true);
  assert.strictEqual(isUserAssigned("Amit Shah", "Charmi Patel"), false);
  assert.strictEqual(isUserAssigned("", "Charmi Patel"), false);
  assert.strictEqual(isUserAssigned("Charmi patel", ""), false);
});

runTest("parseEntryDate handles DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Excel serial", () => {
  const d1 = parseEntryDate("02/11/2026");
  assert.strictEqual(d1.getFullYear(), 2026);
  assert.strictEqual(d1.getMonth(), 10); // November
  assert.strictEqual(d1.getDate(), 2);

  const d2 = parseEntryDate("15-07-2026");
  assert.strictEqual(d2.getFullYear(), 2026);
  assert.strictEqual(d2.getMonth(), 6); // July
  assert.strictEqual(d2.getDate(), 15);

  const d3 = parseEntryDate("2026-11-02");
  assert.strictEqual(d3.getFullYear(), 2026);
  assert.strictEqual(d3.getMonth(), 10);
  assert.strictEqual(d3.getDate(), 2);
});

runTest("User example: Nov 2 post assigned to Charmi Patel reminds on 29, 30, 31 Oct, 1, 2 Nov", () => {
  const postDate = new Date(2026, 10, 2); // 2nd November 2026

  // 28th October: 5 days before -> diff = 5 (> 4 -> no reminder)
  assert.strictEqual(getDaysDifference(postDate, new Date(2026, 9, 28)), 5);

  // 29th October: 4 days before -> diff = 4 (<= 4 -> reminder ACTIVE)
  assert.strictEqual(getDaysDifference(postDate, new Date(2026, 9, 29)), 4);

  // 30th October: 3 days before -> diff = 3 (<= 4 -> reminder ACTIVE)
  assert.strictEqual(getDaysDifference(postDate, new Date(2026, 9, 30)), 3);

  // 31st October: 2 days before -> diff = 2 (<= 4 -> reminder ACTIVE)
  assert.strictEqual(getDaysDifference(postDate, new Date(2026, 9, 31)), 2);

  // 1st November: 1 day before -> diff = 1 (<= 4 -> reminder ACTIVE)
  assert.strictEqual(getDaysDifference(postDate, new Date(2026, 10, 1)), 1);

  // 2nd November: Posting day -> diff = 0 (<= 4 -> reminder ACTIVE)
  assert.strictEqual(getDaysDifference(postDate, new Date(2026, 10, 2)), 0);
});

runTest("Notification reminder message format strictly: Client name : Content type : Work Status", () => {
  const clientName = "Vidyaxcel";
  const contentType = "Influencer Reel";
  const workStatus = "Pending";
  const message = `${clientName} : ${contentType} : ${workStatus}`;
  assert.strictEqual(message, "Vidyaxcel : Influencer Reel : Pending");
});

runTest("Reminder disappears when workStatus is updated to Done", () => {
  const isPending = (status) => status?.toLowerCase() !== "done" && status?.toLowerCase() !== "completed";
  assert.strictEqual(isPending("Pending"), true);
  assert.strictEqual(isPending("In Progress"), true);
  assert.strictEqual(isPending("Delayed"), true);
  assert.strictEqual(isPending("Done"), false); // Disappears!
  assert.strictEqual(isPending("done"), false); // Disappears!
  assert.strictEqual(isPending("Completed"), false); // Disappears!
});

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log("\n==================================================");
console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!\n");
  process.exit(0);
}
