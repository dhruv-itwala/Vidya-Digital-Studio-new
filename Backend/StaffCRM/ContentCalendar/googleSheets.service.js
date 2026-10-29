import crypto from "crypto";
import { getGoogleSheetsClient } from "./googleSheetsAuth.service.js";
import AppError from "../utils/AppError.js";

// Canonical field definitions matching the redesigned Google Sheets content calendar format
export const CANONICAL_FIELD_SYNONYMS = {
  id: ["content id", "id", "post id", "vds id", "vds_id", "item id", "entry id", "row id"],
  date: [
    "date",
    "publish date",
    "publishing date",
    "post date",
    "scheduled date",
    "posting date",
    "schedule date",
    "scheduled on",
  ],
  day: ["day", "day of week", "weekday"],
  time: ["time", "publish time", "publishing time", "scheduled time", "post time"],
  platform: [
    "platform",
    "social media platform",
    "social media",
    "channel",
    "social platform",
    "network",
  ],
  contentType: [
    "content type",
    "post type",
    "format",
    "type",
    "content format",
    "creative type",
    "media type",
  ],
  contentDetails: [
    "content details",
    "details",
    "topic / title",
    "topic",
    "title",
    "content title",
    "concept",
    "headline",
  ],
  caption: [
    "caption",
    "copy",
    "post copy",
    "caption / script",
    "script",
    "text",
    "description",
    "content",
  ],
  hashtags: ["hashtags", "tags", "hash tags", "keywords"],
  adRun: [
    "ad run",
    "ad run date",
    "ad date",
    "ads run",
    "ad run : date",
    "ad",
    "ads",
  ],
  dataLink: [
    "data link",
    "creative url",
    "creative link",
    "media url",
    "media link",
    "design link",
    "asset link",
    "canva link",
    "drive link",
    "link",
    "url",
    "file link",
    "creative",
    "asset",
  ],
  assignedTo: [
    "assigned to",
    "assignee",
    "assigned employee",
    "assigned",
    "creator",
    "editor",
    "designer",
    "owner",
    "employee names",
  ],
  workStatus: [
    "work status",
    "status",
    "task status",
    "production status",
    "stage",
    "state",
    "progress",
  ],
  uploadStatus: [
    "upload status",
    "publishing status",
    "post status",
    "posting status",
    "upload",
  ],
};

// Supported Dropdown Options as specified
export const CONTENT_TYPES = [
  "Instagram Post",
  "Instagram Story",
  "Instagram Reels",
  "Instagram Carousal",
  "Testimonial Post",
  "Influencer Reel",
];

export const WORK_STATUSES = ["Pending", "In Progress", "Done", "Delayed"];

export const UPLOAD_STATUSES = ["Pending", "Uploaded", "Scheduled"];

/**
 * Calculates day of the week from date string.
 * Supports DD/MM/YYYY and YYYY-MM-DD.
 * @param {string} dateStr
 * @returns {string} e.g. "Wednesday"
 */
export const deriveDayOfWeek = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return "";
  const trimmed = dateStr.trim();
  let d = null;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/").map(Number);
    d = new Date(year, month - 1, day);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    d = new Date(year, month - 1, day);
  } else {
    d = new Date(trimmed);
  }

  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long" });
};

/**
 * Formats any date into DD/MM/YYYY.
 * @param {any} val
 * @returns {string}
 */
export const formatDateDDMMYYYY = (val) => {
  if (!val) return "";
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split("/").map(Number);
      return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const [y, m, d] = trimmed.slice(0, 10).split("-").map(Number);
      return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
    }
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

/**
 * Normalizes work status into standard allowed values.
 */
export const normalizeWorkStatus = (rawStatus) => {
  if (!rawStatus) return "";
  const lower = rawStatus.toLowerCase().trim();
  if (lower.includes("prog") || lower.includes("work") || lower.includes("wip")) return "In Progress";
  if (lower.includes("done") || lower.includes("comp") || lower.includes("fin")) return "Done";
  if (lower.includes("delay") || lower.includes("late") || lower.includes("postpone") || lower.includes("hold"))
    return "Delayed";
  if (lower.includes("pend") || lower.includes("wait") || lower.includes("todo") || lower.includes("draft"))
    return "Pending";
  return rawStatus.trim();
};

/**
 * Normalizes upload status into standard allowed values.
 */
export const normalizeUploadStatus = (rawStatus) => {
  if (!rawStatus) return "";
  const lower = rawStatus.toLowerCase().trim();
  if (lower.includes("upload") || lower.includes("pub") || lower.includes("live") || lower.includes("posted"))
    return "Uploaded";
  if (lower.includes("sched") || lower.includes("queue")) return "Scheduled";
  if (lower.includes("pend") || lower.includes("draft") || lower.includes("wait")) return "Pending";
  return rawStatus.trim();
};

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const MONTH_ABBRS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

/**
 * Parses tab title to determine if it represents a month and extracts sorting weight.
 * @param {string} title
 * @returns {{ isMonthTab: boolean, monthIndex: number|null, year: number|null, sortWeight: number, displayName: string }}
 */
export const parseMonthTab = (title) => {
  if (!title || typeof title !== "string") {
    return { isMonthTab: false, monthIndex: null, year: null, sortWeight: 999999, displayName: "" };
  }

  const clean = title.trim().toLowerCase();

  // Extract 4-digit or 2-digit year if present (e.g., 2025, 2026, '26)
  let year = null;
  const yearMatch = clean.match(/\b(20\d\d)\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
  } else {
    const shortYearMatch = clean.match(/'(\d{2})\b/);
    if (shortYearMatch) {
      year = 2000 + parseInt(shortYearMatch[1], 10);
    }
  }

  // If no year found in title, default to current year
  const effectiveYear = year || new Date().getFullYear();

  // Check full month names
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const month = MONTH_NAMES[i];
    // Check if title contains month word
    const regex = new RegExp(`\\b${month}\\b`, "i");
    if (regex.test(clean)) {
      return {
        isMonthTab: true,
        monthIndex: i,
        year: effectiveYear,
        sortWeight: effectiveYear * 12 + i,
        displayName: title.trim(),
      };
    }
  }

  // Check abbreviated month names
  for (let i = 0; i < MONTH_ABBRS.length; i++) {
    const abbr = MONTH_ABBRS[i];
    const regex = new RegExp(`\\b${abbr}\\b`, "i");
    if (regex.test(clean)) {
      return {
        isMonthTab: true,
        monthIndex: i,
        year: effectiveYear,
        sortWeight: effectiveYear * 12 + i,
        displayName: title.trim(),
      };
    }
  }

  // Not a recognizable month tab
  return {
    isMonthTab: false,
    monthIndex: null,
    year: null,
    sortWeight: 999999,
    displayName: title.trim(),
  };
};

/**
 * Finds the tab matching the existing/current month, or the closest month tab.
 * @param {Array} tabList
 * @param {Date} [referenceDate=new Date()]
 * @returns {string} tab title
 */
export const findExistingOrBestMonthTab = (tabList, referenceDate = new Date()) => {
  if (!tabList || tabList.length === 0) return "";
  const currentMonthIdx = referenceDate.getMonth();
  const currentYear = referenceDate.getFullYear();

  // 1. Exact match for existing/current month and year
  const currentMonthTab = tabList.find(
    (t) => t.isMonthTab && t.monthIndex === currentMonthIdx && t.year === currentYear
  );
  if (currentMonthTab) return currentMonthTab.title;

  // 2. Match current month name regardless of year
  const monthNameOnlyTab = tabList.find(
    (t) => t.isMonthTab && t.monthIndex === currentMonthIdx
  );
  if (monthNameOnlyTab) return monthNameOnlyTab.title;

  // 3. Closest month tab
  const monthTabs = tabList.filter((t) => t.isMonthTab && t.sortWeight !== null);
  if (monthTabs.length > 0) {
    const currentWeight = currentYear * 12 + currentMonthIdx;
    let closestTab = monthTabs[0];
    let minDiff = Math.abs(closestTab.sortWeight - currentWeight);

    for (let i = 1; i < monthTabs.length; i++) {
      const diff = Math.abs(monthTabs[i].sortWeight - currentWeight);
      if (diff < minDiff) {
        minDiff = diff;
        closestTab = monthTabs[i];
      }
    }
    return closestTab.title;
  }

  return tabList[0]?.title || "";
};

/**
 * Escapes tab name for Google Sheets ranges (e.g. wrapping in single quotes if contains spaces).
 * @param {string} tabName
 * @returns {string}
 */
export const escapeTabName = (tabName) => {
  const sanitized = tabName.replace(/'/g, "''");
  return `'${sanitized}'`;
};

/**
 * Tests connection to a Google Spreadsheet and returns metadata.
 * @param {string} spreadsheetId
 * @returns {Promise<{ spreadsheetId: string, title: string, sheets: Array }>}
 */
export const getSpreadsheetMetadata = async (spreadsheetId) => {
  const sheetsClient = await getGoogleSheetsClient();

  try {
    const res = await sheetsClient.spreadsheets.get({
      spreadsheetId,
      fields: "properties.title,properties.timeZone,properties.locale,sheets.properties",
    });

    const sheets = (res.data.sheets || []).map((s) => {
      const props = s.properties || {};
      const parsed = parseMonthTab(props.title);
      return {
        sheetId: props.sheetId,
        title: props.title,
        index: props.index,
        rowCount: props.gridProperties?.rowCount || 0,
        columnCount: props.gridProperties?.columnCount || 0,
        ...parsed,
      };
    });

    // Sort tabs: month tabs in REVERSE chronological order (newest month first: Nov 2026, Oct 2026, Sep 2026...)
    // and non-month tabs by sheet index
    sheets.sort((a, b) => {
      if (a.isMonthTab && b.isMonthTab) {
        return b.sortWeight - a.sortWeight;
      }
      if (a.isMonthTab && !b.isMonthTab) return -1;
      if (!a.isMonthTab && b.isMonthTab) return 1;
      return a.index - b.index;
    });

    return {
      spreadsheetId,
      title: res.data.properties?.title || "Untitled Spreadsheet",
      sheets,
    };
  } catch (err) {
    if (err.code === 404) {
      throw new AppError(
        "Google Spreadsheet not found. Please verify the URL and confirm the spreadsheet exists.",
        404
      );
    }
    if (err.code === 403) {
      throw new AppError(
        "Permission denied. Please share the Google Spreadsheet with our Service Account and grant 'Editor' access.",
        403
      );
    }
    throw new AppError(`Google Sheets API error: ${err.message}`, err.code || 500);
  }
};

/**
 * Maps raw spreadsheet header names to canonical field keys.
 * @param {string[]} rawHeaders - Array of strings from row 1
 * @param {Record<string, string>} [userHeaderMapping] - Optional user override mapping
 * @returns {{ columnIndices: Record<string, number>, canonicalToCol: Record<string, number>, colToCanonical: Record<number, string>, unrecognizedCols: Array<{ index: number, header: string }> }}
 */
export const buildHeaderMapping = (rawHeaders = [], userHeaderMapping = {}) => {
  const canonicalToCol = {};
  const colToCanonical = {};
  const unrecognizedCols = [];

  // Normalize user mapping if provided (e.g. { "title": "Headline" })
  const normalizedUserMapping = {};
  if (userHeaderMapping) {
    for (const [canonical, customHeader] of Object.entries(userHeaderMapping)) {
      if (customHeader) {
        normalizedUserMapping[canonical.toLowerCase()] = String(customHeader).trim().toLowerCase();
      }
    }
  }

  rawHeaders.forEach((header, index) => {
    if (!header || typeof header !== "string") return;
    const cleanHeader = header.trim().toLowerCase();

    // Check 1: User override mapping
    let matchedCanonical = null;
    for (const [canonical, customHeader] of Object.entries(normalizedUserMapping)) {
      if (cleanHeader === customHeader) {
        matchedCanonical = canonical;
        break;
      }
    }

    // Check 2: Built-in synonyms (Priority 1: Exact match)
    if (!matchedCanonical) {
      for (const [canonical, synonyms] of Object.entries(CANONICAL_FIELD_SYNONYMS)) {
        if (synonyms.some((syn) => cleanHeader === syn)) {
          matchedCanonical = canonical;
          break;
        }
      }
    }

    // Check 3: Built-in synonyms (Priority 2: Word boundary regex match)
    if (!matchedCanonical) {
      for (const [canonical, synonyms] of Object.entries(CANONICAL_FIELD_SYNONYMS)) {
        if (
          synonyms.some((syn) => {
            const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            return new RegExp(`\\b${escaped}\\b`, "i").test(cleanHeader);
          })
        ) {
          matchedCanonical = canonical;
          break;
        }
      }
    }

    if (matchedCanonical && canonicalToCol[matchedCanonical] === undefined) {
      canonicalToCol[matchedCanonical] = index;
      colToCanonical[index] = matchedCanonical;
    } else {
      unrecognizedCols.push({ index, header: header.trim() });
    }
  });

  // Provide backward compatibility aliases
  if (canonicalToCol.contentDetails !== undefined) {
    if (canonicalToCol.title === undefined) canonicalToCol.title = canonicalToCol.contentDetails;
  }
  if (canonicalToCol.caption !== undefined) {
    if (canonicalToCol.contentDetails === undefined) canonicalToCol.contentDetails = canonicalToCol.caption;
  }
  if (canonicalToCol.dataLink !== undefined) {
    if (canonicalToCol.creativeUrl === undefined) canonicalToCol.creativeUrl = canonicalToCol.dataLink;
  }
  if (canonicalToCol.workStatus !== undefined) {
    if (canonicalToCol.status === undefined) canonicalToCol.status = canonicalToCol.workStatus;
  }

  return {
    canonicalToCol,
    colToCanonical,
    unrecognizedCols,
  };
};

/**
 * Normalizes cell values and cleans up text.
 * @param {any} cell
 * @returns {string}
 */
const cleanCellValue = (cell) => {
  if (cell === null || cell === undefined) return "";
  return String(cell).trim();
};

/**
 * Normalizes status strings into standard values.
 * @param {string} rawStatus
 * @returns {string}
 */
export const normalizeStatus = (rawStatus) => {
  if (!rawStatus) return "Draft";
  const lower = rawStatus.toLowerCase().trim();
  if (lower.includes("sched") || lower.includes("queued")) return "Scheduled";
  if (lower.includes("pub") || lower.includes("live") || lower.includes("done") || lower.includes("posted"))
    return "Published";
  if (lower.includes("review") || lower.includes("pending") || lower.includes("approval"))
    return "Needs Review";
  if (lower.includes("prog") || lower.includes("work") || lower.includes("wip"))
    return "In Progress";
  if (lower.includes("cancel") || lower.includes("reject")) return "Cancelled";
  return rawStatus.trim();
};

/**
 * Fetches and normalizes all rows from a specific tab in a spreadsheet.
 * @param {string} spreadsheetId
 * @param {string} tabTitle
 * @param {Record<string, string>} [userHeaderMapping]
 * @returns {Promise<{ tabTitle: string, headers: string[], rows: Array, totalCount: number, columnMapping: any }>}
 */
export const fetchTabRows = async (spreadsheetId, tabTitle, userHeaderMapping = {}) => {
  const sheetsClient = await getGoogleSheetsClient();
  const escaped = escapeTabName(tabTitle);

  try {
    const res = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: `${escaped}!A1:ZZ1000`,
      valueRenderOption: "FORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });

    const values = res.data.values || [];

    if (values.length === 0) {
      return {
        tabTitle,
        headers: [],
        rows: [],
        totalCount: 0,
        columnMapping: {},
      };
    }

    const rawHeaders = values[0] || [];
    const mapping = buildHeaderMapping(rawHeaders, userHeaderMapping);

    const rows = [];

    for (let i = 1; i < values.length; i++) {
      const rowArr = values[i] || [];
      // Skip row if completely empty
      const isCompletelyEmpty = rowArr.every((cell) => !cell || String(cell).trim() === "");
      if (isCompletelyEmpty) continue;

      const rowIndex = i + 1; // 1-based sheet row number (Row 2, Row 3...)

      // Extract canonical fields
      const entry = {
        _rowIndex: rowIndex,
        _tabTitle: tabTitle,
      };

      for (const canonical of Object.keys(CANONICAL_FIELD_SYNONYMS)) {
        const colIdx = mapping.canonicalToCol[canonical];
        entry[canonical] = colIdx !== undefined ? cleanCellValue(rowArr[colIdx]) : "";
      }

      // Collect any unrecognized custom columns
      entry.customFields = {};
      mapping.unrecognizedCols.forEach(({ index, header }) => {
        const val = cleanCellValue(rowArr[index]);
        if (val) {
          entry.customFields[header] = val;
        }
      });

      // Format Date & Ad Run
      if (entry.date) {
        entry.date = formatDateDDMMYYYY(entry.date);
      }
      if (!entry.day && entry.date) {
        entry.day = deriveDayOfWeek(entry.date);
      }
      if (entry.adRun) {
        entry.adRun = formatDateDDMMYYYY(entry.adRun);
      }

      // Normalize statuses
      entry.workStatus = normalizeWorkStatus(entry.workStatus || entry.status);
      entry.uploadStatus = normalizeUploadStatus(entry.uploadStatus);

      // Backwards compatibility aliases
      entry.status = entry.workStatus || "";
      entry.title = entry.contentDetails || entry.title || "";
      entry.caption = entry.contentDetails || entry.caption || "";
      entry.creativeUrl = entry.dataLink || entry.creativeUrl || "";
      entry.platform = entry.contentType || entry.platform || "";

      // Stable row identification:
      // If the row already has an explicit ID in the ID column, use it.
      // Otherwise, generate a stable synthetic ID based on row index and content hash.
      if (!entry.id) {
        const composite = `${tabTitle}|${rowIndex}|${entry.date}|${entry.contentDetails || entry.title}|${entry.contentType}`;
        const hash = crypto.createHash("sha1").update(composite).digest("hex").slice(0, 10);
        entry.id = `ROW_${rowIndex}_${hash}`;
        entry._isSyntheticId = true;
      } else {
        entry._isSyntheticId = false;
      }

      rows.push(entry);
    }

    return {
      tabTitle,
      headers: rawHeaders,
      rows,
      totalCount: rows.length,
      columnMapping: mapping.canonicalToCol,
    };
  } catch (err) {
    if (err.code === 404) {
      throw new AppError(`Spreadsheet or Tab '${tabTitle}' not found`, 404);
    }
    if (err.code === 403) {
      throw new AppError("Permission denied when reading spreadsheet", 403);
    }
    throw new AppError(`Failed to read tab '${tabTitle}': ${err.message}`, 500);
  }
};

/**
 * Standard default headers matching the redesigned Google Sheets content calendar specification
 */
export const DEFAULT_SHEET_HEADERS = [
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

/**
 * Appends a new content entry to a monthly tab.
 * @param {string} spreadsheetId
 * @param {string} tabTitle
 * @param {Record<string, any>} entryData
 * @param {Record<string, string>} [userHeaderMapping]
 * @returns {Promise<{ createdRow: any, rowIndex: number }>}
 */
export const appendTabRow = async (
  spreadsheetId,
  tabTitle,
  entryData,
  userHeaderMapping = {}
) => {
  const sheetsClient = await getGoogleSheetsClient();
  const escaped = escapeTabName(tabTitle);

  // 1. Fetch existing headers
  const headerRes = await sheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range: `${escaped}!1:1`,
  });

  let rawHeaders = headerRes.data.values?.[0] || [];

  // If tab is totally empty, seed with standard headers
  if (rawHeaders.length === 0) {
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId,
      range: `${escaped}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [DEFAULT_SHEET_HEADERS],
      },
    });
    rawHeaders = DEFAULT_SHEET_HEADERS;
  }

  const mapping = buildHeaderMapping(rawHeaders, userHeaderMapping);

  // Format date, day, adRun, workStatus, uploadStatus, assignedTo
  const formattedDate = formatDateDDMMYYYY(entryData.date);
  const derivedDay = entryData.day || deriveDayOfWeek(formattedDate);
  const formattedAdRun = formatDateDDMMYYYY(entryData.adRun);
  const assignedStr = Array.isArray(entryData.assignedTo)
    ? entryData.assignedTo.join(", ")
    : (entryData.assignedTo || "");
  const normalizedWork = normalizeWorkStatus(entryData.workStatus || entryData.status);
  const normalizedUpload = normalizeUploadStatus(entryData.uploadStatus);

  // Generate a distinct, stable unique content ID if sheet has an ID column
  const uniqueId = `VDS-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    100 + Math.random() * 900
  )}`;

  const finalData = {
    ...entryData,
    date: formattedDate,
    day: derivedDay,
    adRun: formattedAdRun,
    assignedTo: assignedStr,
    workStatus: normalizedWork,
    uploadStatus: normalizedUpload,
    status: normalizedWork,
    contentDetails: entryData.contentDetails || entryData.caption || entryData.title || "",
    dataLink: entryData.dataLink || entryData.creativeUrl || "",
    contentType: entryData.contentType || entryData.platform || "Instagram Post",
    id: entryData.id || uniqueId,
  };

  // Build row array according to raw headers length
  const rowValues = new Array(rawHeaders.length).fill("");

  for (const [canonical, colIdx] of Object.entries(mapping.canonicalToCol)) {
    if (finalData[canonical] !== undefined) {
      rowValues[colIdx] = String(finalData[canonical] ?? "");
    }
  }

  // If there are custom fields, insert them
  if (finalData.customFields && typeof finalData.customFields === "object") {
    mapping.unrecognizedCols.forEach(({ index, header }) => {
      if (finalData.customFields[header] !== undefined) {
        rowValues[index] = String(finalData.customFields[header]);
      }
    });
  }

  // Append to sheet
  const appendRes = await sheetsClient.spreadsheets.values.append({
    spreadsheetId,
    range: `${escaped}!A:ZZ`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [rowValues],
    },
  });

  // Determine updated range row number if returned
  const updatedRange = appendRes.data.updates?.updatedRange || "";
  const rowMatch = updatedRange.match(/!A?(\d+)/);
  const newRowIndex = rowMatch ? parseInt(rowMatch[1], 10) : 0;

  return {
    createdRow: {
      ...finalData,
      _rowIndex: newRowIndex,
      _tabTitle: tabTitle,
    },
    rowIndex: newRowIndex,
  };
};

/**
 * Resolves the current row index of an entry using stable ID or fallback heuristics.
 * @param {string[][]} values - Full 2D array of sheet values
 * @param {any} mapping - Header mapping
 * @param {string} rowIdentifier - Either content ID (e.g. VDS-..., ROW_2_...) or integer
 * @param {Record<string, any>} [fallbackCriteria] - Date/title to verify
 * @returns {number|null} 1-based row index or null if not found
 */
export const findRowIndexById = (values, mapping, rowIdentifier, fallbackCriteria = null) => {
  const idColIdx = mapping.canonicalToCol.id;

  // 1. Search in ID column if available
  if (idColIdx !== undefined) {
    for (let i = 1; i < values.length; i++) {
      const cellId = cleanCellValue(values[i][idColIdx]);
      if (cellId && cellId === rowIdentifier) {
        return i + 1; // 1-based row index
      }
    }
  }

  // 2. If rowIdentifier is a synthetic ID e.g. "ROW_5_abc123"
  if (typeof rowIdentifier === "string" && rowIdentifier.startsWith("ROW_")) {
    const parts = rowIdentifier.split("_");
    const parsedIdx = parseInt(parts[1], 10);
    if (!isNaN(parsedIdx) && parsedIdx >= 2 && parsedIdx <= values.length) {
      return parsedIdx;
    }
  }

  // 3. Fallback: match by contentDetails/title + date if provided
  if (fallbackCriteria) {
    const detailsCol = mapping.canonicalToCol.contentDetails ?? mapping.canonicalToCol.title;
    const dateCol = mapping.canonicalToCol.date;
    const targetText = fallbackCriteria.contentDetails || fallbackCriteria.title || "";
    const targetDate = fallbackCriteria.date ? formatDateDDMMYYYY(fallbackCriteria.date) : "";

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const rowText = detailsCol !== undefined ? cleanCellValue(row[detailsCol]) : "";
      const rowDate = dateCol !== undefined ? formatDateDDMMYYYY(cleanCellValue(row[dateCol])) : "";
      if (
        targetText &&
        rowText.toLowerCase() === targetText.toLowerCase() &&
        (!targetDate || rowDate === targetDate)
      ) {
        return i + 1;
      }
    }
  }

  return null;
};

/**
 * Updates a content entry in a monthly tab.
 * @param {string} spreadsheetId
 * @param {string} tabTitle
 * @param {string} rowIdentifier - Stable Content ID or Row ID
 * @param {Record<string, any>} updateData - Fields to update
 * @param {Record<string, string>} [userHeaderMapping]
 * @returns {Promise<{ updatedRow: any, rowIndex: number }>}
 */
export const updateTabRow = async (
  spreadsheetId,
  tabTitle,
  rowIdentifier,
  updateData,
  userHeaderMapping = {}
) => {
  const sheetsClient = await getGoogleSheetsClient();
  const escaped = escapeTabName(tabTitle);

  // 1. Fetch current tab values
  const getRes = await sheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range: `${escaped}!A1:ZZ1000`,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const values = getRes.data.values || [];
  if (values.length <= 1) {
    throw new AppError("No data rows found in this tab", 404);
  }

  const rawHeaders = values[0];
  const mapping = buildHeaderMapping(rawHeaders, userHeaderMapping);

  // 2. Find row index
  const targetRowIndex = findRowIndexById(values, mapping, rowIdentifier, updateData);

  if (!targetRowIndex || targetRowIndex < 2 || targetRowIndex > values.length) {
    throw new AppError(
      `Could not locate row '${rowIdentifier}' in tab '${tabTitle}'. The row may have been deleted or moved.`,
      404
    );
  }

  const existingRow = values[targetRowIndex - 1] || [];
  const updatedRowValues = [...existingRow];

  // Ensure row has enough cells to cover all headers
  while (updatedRowValues.length < rawHeaders.length) {
    updatedRowValues.push("");
  }

  // Normalize update fields
  const formattedDate = updateData.date !== undefined ? formatDateDDMMYYYY(updateData.date) : undefined;
  const derivedDay = updateData.day !== undefined 
    ? updateData.day 
    : (formattedDate ? deriveDayOfWeek(formattedDate) : undefined);
  const formattedAdRun = updateData.adRun !== undefined ? formatDateDDMMYYYY(updateData.adRun) : undefined;
  const assignedStr = Array.isArray(updateData.assignedTo)
    ? updateData.assignedTo.join(", ")
    : updateData.assignedTo;
  const normalizedWork = updateData.workStatus !== undefined 
    ? normalizeWorkStatus(updateData.workStatus) 
    : (updateData.status !== undefined ? normalizeWorkStatus(updateData.status) : undefined);
  const normalizedUpload = updateData.uploadStatus !== undefined 
    ? normalizeUploadStatus(updateData.uploadStatus) 
    : undefined;

  const normalizedUpdateData = { ...updateData };
  if (formattedDate !== undefined) normalizedUpdateData.date = formattedDate;
  if (derivedDay !== undefined) normalizedUpdateData.day = derivedDay;
  if (formattedAdRun !== undefined) normalizedUpdateData.adRun = formattedAdRun;
  if (assignedStr !== undefined) normalizedUpdateData.assignedTo = assignedStr;
  if (normalizedWork !== undefined) {
    normalizedUpdateData.workStatus = normalizedWork;
    normalizedUpdateData.status = normalizedWork;
  }
  if (normalizedUpload !== undefined) normalizedUpdateData.uploadStatus = normalizedUpload;
  if (normalizedUpdateData.contentDetails !== undefined) {
    normalizedUpdateData.title = normalizedUpdateData.contentDetails;
    normalizedUpdateData.caption = normalizedUpdateData.contentDetails;
  } else if (normalizedUpdateData.caption !== undefined || normalizedUpdateData.title !== undefined) {
    normalizedUpdateData.contentDetails = normalizedUpdateData.caption || normalizedUpdateData.title;
  }
  if (normalizedUpdateData.dataLink !== undefined) {
    normalizedUpdateData.creativeUrl = normalizedUpdateData.dataLink;
  } else if (normalizedUpdateData.creativeUrl !== undefined) {
    normalizedUpdateData.dataLink = normalizedUpdateData.creativeUrl;
  }
  if (normalizedUpdateData.contentType !== undefined) {
    normalizedUpdateData.platform = normalizedUpdateData.contentType;
  }

  // Update canonical fields
  for (const [canonical, colIdx] of Object.entries(mapping.canonicalToCol)) {
    if (normalizedUpdateData[canonical] !== undefined && canonical !== "id") {
      updatedRowValues[colIdx] = String(normalizedUpdateData[canonical] ?? "");
    }
  }

  // Update custom fields if present
  if (normalizedUpdateData.customFields && typeof normalizedUpdateData.customFields === "object") {
    mapping.unrecognizedCols.forEach(({ index, header }) => {
      if (normalizedUpdateData.customFields[header] !== undefined) {
        updatedRowValues[index] = String(normalizedUpdateData.customFields[header]);
      }
    });
  }

  // Write updated row back to Google Sheets
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId,
    range: `${escaped}!A${targetRowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [updatedRowValues],
    },
  });

  return {
    updatedRow: {
      ...normalizedUpdateData,
      _rowIndex: targetRowIndex,
      _tabTitle: tabTitle,
    },
    rowIndex: targetRowIndex,
  };
};

/**
 * Creates a new tab (e.g. "July 2026") in the spreadsheet with default headers.
 * @param {string} spreadsheetId
 * @param {string} tabTitle
 * @returns {Promise<any>}
 */
export const createTabInSpreadsheet = async (spreadsheetId, tabTitle) => {
  const sheetsClient = await getGoogleSheetsClient();
  const cleanTitle = tabTitle.trim();

  try {
    const addRes = await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: cleanTitle,
              },
            },
          },
        ],
      },
    });

    const newSheetProps = addRes.data.replies?.[0]?.addSheet?.properties;

    // Seed headers
    const escaped = escapeTabName(cleanTitle);
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId,
      range: `${escaped}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [DEFAULT_SHEET_HEADERS],
      },
    });

    return {
      sheetId: newSheetProps?.sheetId,
      title: cleanTitle,
      ...parseMonthTab(cleanTitle),
    };
  } catch (err) {
    if (err.message && err.message.includes("already exists")) {
      throw new AppError(`Tab '${cleanTitle}' already exists in this spreadsheet`, 400);
    }
    throw new AppError(`Failed to create tab in Google Sheets: ${err.message}`, err.code || 500);
  }
};

/**
 * Deletes a content entry row from a monthly tab.
 * Uses batchUpdate deleteDimension to eliminate the row cleanly.
 * @param {string} spreadsheetId
 * @param {string} tabTitle
 * @param {string} rowIdentifier
 * @param {Record<string, string>} [userHeaderMapping]
 * @returns {Promise<{ success: boolean, deletedRowIndex: number }>}
 */
export const deleteTabRow = async (
  spreadsheetId,
  tabTitle,
  rowIdentifier,
  userHeaderMapping = {}
) => {
  const sheetsClient = await getGoogleSheetsClient();
  const escaped = escapeTabName(tabTitle);

  // 1. Fetch metadata to get numeric sheetId
  const meta = await sheetsClient.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  });

  const sheet = (meta.data.sheets || []).find(
    (s) => s.properties?.title?.toLowerCase() === tabTitle.toLowerCase()
  );

  if (!sheet) {
    throw new AppError(`Tab '${tabTitle}' not found in spreadsheet`, 404);
  }

  const numericSheetId = sheet.properties.sheetId;

  // 2. Fetch current values to locate the row
  const getRes = await sheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range: `${escaped}!A1:ZZ1000`,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const values = getRes.data.values || [];
  const rawHeaders = values[0] || [];
  const mapping = buildHeaderMapping(rawHeaders, userHeaderMapping);

  const targetRowIndex = findRowIndexById(values, mapping, rowIdentifier);

  if (!targetRowIndex || targetRowIndex < 2 || targetRowIndex > values.length) {
    throw new AppError(
      `Could not locate row '${rowIdentifier}' to delete in tab '${tabTitle}'.`,
      404
    );
  }

  // 3. Delete dimension via batchUpdate
  // startIndex is 0-indexed inclusive, endIndex is exclusive
  await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: numericSheetId,
              dimension: "ROWS",
              startIndex: targetRowIndex - 1,
              endIndex: targetRowIndex,
            },
          },
        },
      ],
    },
  });

  return {
    success: true,
    deletedRowIndex: targetRowIndex,
  };
};
