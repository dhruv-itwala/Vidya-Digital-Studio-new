import Client from "../Clients/Client.model.js";
import AppError from "../utils/AppError.js";
import {
  extractSpreadsheetId,
  isGoogleConfigured,
  getServiceAccountEmail,
} from "./googleSheetsAuth.service.js";
import {
  getSpreadsheetMetadata,
  fetchTabRows,
  appendTabRow,
  updateTabRow,
  deleteTabRow,
  createTabInSpreadsheet,
  findExistingOrBestMonthTab,
} from "./googleSheets.service.js";

// In-memory cache for sheet metadata and entries to optimize API quotas
// Map<string, { data: any, expiresAt: number }>
const calendarCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

const getCacheKey = (clientId, suffix) => `${clientId}:${suffix}`;

export const invalidateCalendarCache = (clientId) => {
  const prefix = `${clientId}:`;
  for (const key of calendarCache.keys()) {
    if (key.startsWith(prefix)) {
      calendarCache.delete(key);
    }
  }
};

/**
 * Resolves client record and checks googleSheetsConfig.
 * @param {string} clientId
 * @returns {Promise<import("../Clients/Client.model.js").default>}
 */
export const getClientWithSpreadsheet = async (clientId) => {
  const client = await Client.findById(clientId);
  if (!client) {
    throw new AppError("Client not found", 404);
  }

  // Fallback to contentCalendarLink if googleSheetsConfig is empty
  let spreadsheetId = client.googleSheetsConfig?.spreadsheetId;
  let spreadsheetUrl = client.googleSheetsConfig?.spreadsheetUrl;

  if (!spreadsheetId && client.contentCalendarLink) {
    try {
      spreadsheetId = extractSpreadsheetId(client.contentCalendarLink);
      spreadsheetUrl = client.contentCalendarLink;
      client.googleSheetsConfig = {
        spreadsheetId,
        spreadsheetUrl,
        status: "connected",
        connectedAt: new Date(),
        lastSyncedAt: new Date(),
      };
      await client.save();
    } catch {
      // not a valid spreadsheet link, ignore
    }
  }

  return client;
};

/**
 * Retrieves connection and sync status for a client.
 * @param {string} clientId
 * @returns {Promise<any>}
 */
export const getCalendarStatusService = async (clientId) => {
  const client = await getClientWithSpreadsheet(clientId);
  const isConfigured = isGoogleConfigured();
  const serviceAccountEmail = getServiceAccountEmail();

  const config = client.googleSheetsConfig || {};

  return {
    isGoogleConfigured: isConfigured,
    serviceAccountEmail,
    isConnected: Boolean(config.spreadsheetId && config.status === "connected"),
    status: config.status || "disconnected",
    spreadsheetId: config.spreadsheetId || null,
    spreadsheetUrl: config.spreadsheetUrl || client.contentCalendarLink || null,
    sheetTitle: config.sheetTitle || null,
    selectedTab: config.selectedTab || null,
    connectedAt: config.connectedAt || null,
    lastSyncedAt: config.lastSyncedAt || null,
    errorMessage: config.errorMessage || null,
    clientName: client.clientName,
  };
};

/**
 * Connects or updates a Google Spreadsheet URL for a client.
 * @param {string} clientId
 * @param {string} spreadsheetUrl
 * @param {any} [user]
 * @returns {Promise<any>}
 */
export const connectSpreadsheetService = async (clientId, spreadsheetUrl, user) => {
  if (!spreadsheetUrl) {
    throw new AppError("Google Spreadsheet URL is required", 400);
  }

  const client = await Client.findById(clientId);
  if (!client) {
    throw new AppError("Client not found", 404);
  }

  const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);

  // Validate accessibility via Google Sheets API
  let metadata;
  try {
    metadata = await getSpreadsheetMetadata(spreadsheetId);
  } catch (err) {
    // Record error in database so portal shows actionable state
    client.googleSheetsConfig = {
      ...client.googleSheetsConfig,
      spreadsheetId,
      spreadsheetUrl,
      status: "error",
      errorMessage: err.message,
      lastSyncedAt: new Date(),
    };
    await client.save();
    throw err;
  }

  const defaultTab = findExistingOrBestMonthTab(metadata.sheets);

  client.googleSheetsConfig = {
    spreadsheetId,
    spreadsheetUrl,
    sheetTitle: metadata.title,
    connectedAt: client.googleSheetsConfig?.connectedAt || new Date(),
    lastSyncedAt: new Date(),
    status: "connected",
    errorMessage: null,
    selectedTab: defaultTab,
    headerMapping: client.googleSheetsConfig?.headerMapping || {},
  };

  // Keep legacy contentCalendarLink in sync
  client.contentCalendarLink = spreadsheetUrl;

  await client.save();
  invalidateCalendarCache(clientId);

  return {
    success: true,
    message: "Google Spreadsheet connected successfully",
    spreadsheetId,
    sheetTitle: metadata.title,
    tabs: metadata.sheets,
    selectedTab: defaultTab,
  };
};

/**
 * Disconnects Google Spreadsheet from client.
 * @param {string} clientId
 * @param {any} [user]
 * @returns {Promise<any>}
 */
export const disconnectSpreadsheetService = async (clientId, user) => {
  const client = await Client.findById(clientId);
  if (!client) {
    throw new AppError("Client not found", 404);
  }

  client.googleSheetsConfig = {
    status: "disconnected",
    spreadsheetId: null,
    spreadsheetUrl: null,
    sheetTitle: null,
    errorMessage: null,
    selectedTab: null,
    lastSyncedAt: new Date(),
  };

  await client.save();
  invalidateCalendarCache(clientId);

  return {
    success: true,
    message: "Google Spreadsheet disconnected",
  };
};

/**
 * Retrieves all available tabs for a client's connected spreadsheet.
 * @param {string} clientId
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<{ tabs: Array, sheetTitle: string, lastSyncedAt: Date }>}
 */
export const getCalendarTabsService = async (clientId, forceRefresh = false) => {
  const client = await getClientWithSpreadsheet(clientId);
  const spreadsheetId = client.googleSheetsConfig?.spreadsheetId;

  if (!spreadsheetId || client.googleSheetsConfig?.status !== "connected") {
    throw new AppError("No Google Spreadsheet connected for this client", 400);
  }

  const cacheKey = getCacheKey(clientId, "tabs");
  if (!forceRefresh) {
    const cached = calendarCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  const metadata = await getSpreadsheetMetadata(spreadsheetId);

  // Update client sheet title if changed
  if (client.googleSheetsConfig.sheetTitle !== metadata.title) {
    client.googleSheetsConfig.sheetTitle = metadata.title;
    client.googleSheetsConfig.lastSyncedAt = new Date();
    await client.save();
  }

  const result = {
    spreadsheetId,
    sheetTitle: metadata.title,
    tabs: metadata.sheets,
    selectedTab: client.googleSheetsConfig?.selectedTab || metadata.sheets[0]?.title || "",
    lastSyncedAt: new Date(),
  };

  calendarCache.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return result;
};

/**
 * Creates a new month tab (e.g. "July 2026") in the client's spreadsheet.
 * @param {string} clientId
 * @param {string} tabTitle
 * @param {any} [user]
 * @returns {Promise<any>}
 */
export const createMonthTabService = async (clientId, tabTitle, user) => {
  if (!tabTitle || !tabTitle.trim()) {
    throw new AppError("Tab title is required (e.g. 'July 2026')", 400);
  }

  const client = await getClientWithSpreadsheet(clientId);
  const spreadsheetId = client.googleSheetsConfig?.spreadsheetId;

  if (!spreadsheetId || client.googleSheetsConfig?.status !== "connected") {
    throw new AppError("No Google Spreadsheet connected for this client", 400);
  }

  const cleanTitle = tabTitle.trim();
  const createdTab = await createTabInSpreadsheet(spreadsheetId, cleanTitle);

  // Set as selected tab in client config
  client.googleSheetsConfig.selectedTab = cleanTitle;
  client.googleSheetsConfig.lastSyncedAt = new Date();
  await client.save();

  invalidateCalendarCache(clientId);

  return createdTab;
};

/**
 * Retrieves content calendar entries for a selected tab with filtering and search.
 * @param {string} clientId
 * @param {{ tab?: string, search?: string, platform?: string, status?: string, contentType?: string, workStatus?: string, uploadStatus?: string, forceRefresh?: boolean }} query
 * @param {boolean} [isClientPortal=false]
 * @returns {Promise<any>}
 */
export const getCalendarEntriesService = async (
  clientId,
  { tab, search, platform, status, contentType, workStatus, uploadStatus, forceRefresh = false },
  isClientPortal = false
) => {
  const client = await getClientWithSpreadsheet(clientId);
  const spreadsheetId = client.googleSheetsConfig?.spreadsheetId;

  if (!spreadsheetId || client.googleSheetsConfig?.status !== "connected") {
    throw new AppError("No Google Spreadsheet connected for this client", 400);
  }

  // Resolve active tab
  let targetTab = tab || client.googleSheetsConfig?.selectedTab;
  if (!targetTab) {
    const tabsData = await getCalendarTabsService(clientId, forceRefresh);
    targetTab = findExistingOrBestMonthTab(tabsData.tabs);
  }

  if (!targetTab) {
    throw new AppError("No tabs found in the connected spreadsheet", 404);
  }

  const cacheKey = getCacheKey(clientId, `entries:${targetTab}`);
  let tabData;

  if (!forceRefresh) {
    const cached = calendarCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      tabData = cached.data;
    }
  }

  if (!tabData) {
    const headerMapping = client.googleSheetsConfig?.headerMapping
      ? Object.fromEntries(client.googleSheetsConfig.headerMapping)
      : {};

    tabData = await fetchTabRows(spreadsheetId, targetTab, headerMapping);

    calendarCache.set(cacheKey, {
      data: tabData,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  // Filter rows
  let filteredRows = [...tabData.rows];

  if (isClientPortal) {
    // Hide internal notes for client security
    filteredRows = filteredRows.map((r) => {
      const copy = { ...r };
      delete copy.notes;
      return copy;
    });
  }

  // Content Type filter
  const typeFilter = contentType || platform;
  if (typeFilter && typeFilter.toLowerCase() !== "all") {
    const pLower = typeFilter.toLowerCase();
    filteredRows = filteredRows.filter((r) =>
      r.contentType?.toLowerCase().includes(pLower) || r.platform?.toLowerCase().includes(pLower)
    );
  }

  // Work Status filter
  const workStatusFilter = workStatus || status;
  if (workStatusFilter && workStatusFilter.toLowerCase() !== "all") {
    const sLower = workStatusFilter.toLowerCase();
    filteredRows = filteredRows.filter((r) =>
      r.workStatus?.toLowerCase() === sLower || r.status?.toLowerCase() === sLower
    );
  }

  // Upload Status filter
  if (uploadStatus && uploadStatus.toLowerCase() !== "all") {
    const uLower = uploadStatus.toLowerCase();
    filteredRows = filteredRows.filter((r) =>
      r.uploadStatus?.toLowerCase() === uLower
    );
  }

  // Search filter across details, date, day, assignedTo
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filteredRows = filteredRows.filter(
      (r) =>
        r.contentDetails?.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q) ||
        r.caption?.toLowerCase().includes(q) ||
        r.contentType?.toLowerCase().includes(q) ||
        r.assignedTo?.toLowerCase().includes(q) ||
        r.day?.toLowerCase().includes(q) ||
        r.date?.toLowerCase().includes(q) ||
        r.adRun?.toLowerCase().includes(q)
    );
  }

  return {
    tabTitle: targetTab,
    spreadsheetId,
    sheetTitle: client.googleSheetsConfig?.sheetTitle,
    entries: filteredRows,
    totalCount: filteredRows.length,
    rawTotalCount: tabData.rows.length,
    headers: tabData.headers,
    lastSyncedAt: new Date(),
  };
};

/**
 * Creates a new content entry in a monthly tab.
 * @param {string} clientId
 * @param {{ tab: string, entryData: any }} payload
 * @param {any} user
 * @returns {Promise<any>}
 */
export const createCalendarEntryService = async (clientId, { tab, entryData }, user) => {
  const client = await getClientWithSpreadsheet(clientId);
  const spreadsheetId = client.googleSheetsConfig?.spreadsheetId;

  if (!spreadsheetId || client.googleSheetsConfig?.status !== "connected") {
    throw new AppError("No Google Spreadsheet connected for this client", 400);
  }

  if (!tab) {
    throw new AppError("Monthly tab name is required", 400);
  }

  const headerMapping = client.googleSheetsConfig?.headerMapping
    ? Object.fromEntries(client.googleSheetsConfig.headerMapping)
    : {};

  const result = await appendTabRow(spreadsheetId, tab, entryData, headerMapping);

  invalidateCalendarCache(clientId);

  return result;
};

/**
 * Updates a content entry in a monthly tab.
 * @param {string} clientId
 * @param {{ tab: string, rowId: string, updateData: any }} payload
 * @param {any} user
 * @returns {Promise<any>}
 */
export const updateCalendarEntryService = async (
  clientId,
  { tab, rowId, updateData },
  user
) => {
  const client = await getClientWithSpreadsheet(clientId);
  const spreadsheetId = client.googleSheetsConfig?.spreadsheetId;

  if (!spreadsheetId || client.googleSheetsConfig?.status !== "connected") {
    throw new AppError("No Google Spreadsheet connected for this client", 400);
  }

  if (!tab || !rowId) {
    throw new AppError("Tab name and Row ID are required", 400);
  }

  const headerMapping = client.googleSheetsConfig?.headerMapping
    ? Object.fromEntries(client.googleSheetsConfig.headerMapping)
    : {};

  const result = await updateTabRow(
    spreadsheetId,
    tab,
    rowId,
    updateData,
    headerMapping
  );

  invalidateCalendarCache(clientId);

  return result;
};

/**
 * Deletes a content entry row in a monthly tab.
 * @param {string} clientId
 * @param {{ tab: string, rowId: string }} payload
 * @param {any} user
 * @returns {Promise<any>}
 */
export const deleteCalendarEntryService = async (clientId, { tab, rowId }, user) => {
  const client = await getClientWithSpreadsheet(clientId);
  const spreadsheetId = client.googleSheetsConfig?.spreadsheetId;

  if (!spreadsheetId || client.googleSheetsConfig?.status !== "connected") {
    throw new AppError("No Google Spreadsheet connected for this client", 400);
  }

  if (!tab || !rowId) {
    throw new AppError("Tab name and Row ID are required", 400);
  }

  const headerMapping = client.googleSheetsConfig?.headerMapping
    ? Object.fromEntries(client.googleSheetsConfig.headerMapping)
    : {};

  const result = await deleteTabRow(
    spreadsheetId,
    tab,
    rowId,
    headerMapping
  );

  invalidateCalendarCache(clientId);

  return result;
};

/**
 * Checks if a given user's name is assigned in the assignedTo field.
 * Handles comma, semicolon, slash separation and case insensitivity.
 * @param {string} assignedTo
 * @param {string} userName
 * @returns {boolean}
 */
export const isUserAssigned = (assignedTo, userName) => {
  if (!assignedTo || !userName) return false;
  const target = String(userName).trim().toLowerCase();
  if (!target) return false;

  const names = String(assignedTo)
    .split(/[,;/]+/)
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);

  return names.some((n) => n === target || n.includes(target) || target.includes(n));
};

/**
 * Parses any supported date string into a Date at midnight.
 * @param {string|number|Date} dateVal
 * @returns {Date|null}
 */
export const parseEntryDate = (dateVal) => {
  if (!dateVal && dateVal !== 0) return null;
  const str = String(dateVal).trim();
  if (!str) return null;

  // Numeric Excel serial (e.g. 45488)
  if (/^\d{5}$/.test(str)) {
    const num = Number(str);
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  let m = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (m) {
    return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  }

  // YYYY-MM-DD or YYYY/MM/DD
  m = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  }

  // DD/MM/YY
  m = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (m) {
    return new Date(2000 + parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  return null;
};

/**
 * Calculates calendar day difference between targetDate and fromDate.
 * targetDate - fromDate in whole days.
 * @param {Date} targetDate
 * @param {Date} [fromDate=new Date()]
 * @returns {number}
 */
export const getDaysDifference = (targetDate, fromDate = new Date()) => {
  if (!targetDate) return 999999;
  const d1 = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const d2 = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const diffMs = d1.getTime() - d2.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Retrieves content calendar reminder notifications for the logged in employee.
 * Finds all content assigned to this user across connected clients where work is not Done
 * and posting date is within 4 days (or up to 30 days overdue).
 * Format: Client name : Content type : Work Status
 * @param {any} user
 * @param {Date} [referenceDate=new Date()]
 * @returns {Promise<{ success: boolean, count: number, reminders: Array }>}
 */
export const getUserCalendarRemindersService = async (user, referenceDate = new Date()) => {
  if (!user || !user.name) {
    return { success: true, count: 0, reminders: [] };
  }

  const userName = user.name.trim();

  // Find all active clients with connected Google Sheets
  const clients = await Client.find({
    isActive: { $ne: false },
    "googleSheetsConfig.status": "connected",
    "googleSheetsConfig.spreadsheetId": { $exists: true, $ne: "" },
  }).lean();

  if (!clients || clients.length === 0) {
    return { success: true, count: 0, reminders: [] };
  }

  const reminders = [];
  const now = referenceDate;
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  for (const client of clients) {
    const spreadsheetId = client.googleSheetsConfig.spreadsheetId;
    if (!spreadsheetId) continue;

    try {
      // 1. Get client tabs (cached)
      const tabsData = await getCalendarTabsService(client._id, false);
      const allTabs = tabsData.tabs || [];

      // Select relevant tabs: current month, next month, prev month, or client's selectedTab
      const relevantTabs = allTabs.filter((tab) => {
        if (tab.title === client.googleSheetsConfig.selectedTab) return true;
        if (tab.isMonthTab && tab.year) {
          // Tabs within current year and within +/- 1 month
          const monthDist = Math.abs((tab.year - currentYear) * 12 + (tab.monthIndex - currentMonthIdx));
          return monthDist <= 1;
        }
        return false;
      });

      // If no relevant tabs matched, fallback to selectedTab or first tab
      const targetTabs = relevantTabs.length > 0 ? relevantTabs : allTabs.slice(0, 2);

      for (const tabObj of targetTabs) {
        const tabTitle = tabObj.title;
        const headerMapping = client.googleSheetsConfig?.headerMapping
          ? (client.googleSheetsConfig.headerMapping instanceof Map
              ? Object.fromEntries(client.googleSheetsConfig.headerMapping)
              : client.googleSheetsConfig.headerMapping)
          : {};

        let tabData;
        const cacheKey = getCacheKey(client._id, `entries:${tabTitle}`);
        const cached = calendarCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          tabData = cached.data;
        } else {
          try {
            tabData = await fetchTabRows(spreadsheetId, tabTitle, headerMapping);
            calendarCache.set(cacheKey, { data: tabData, expiresAt: Date.now() + CACHE_TTL_MS });
          } catch {
            continue;
          }
        }

        if (!tabData || !tabData.rows) continue;

        for (let rIdx = 0; rIdx < tabData.rows.length; rIdx++) {
          const row = tabData.rows[rIdx];

          // Must have date and content type scheduled
          if (!row.date || !row.contentType || !row.contentType.trim()) continue;

          // Check if work status is Done
          const ws = (row.workStatus || "").trim().toLowerCase();
          if (ws === "done" || ws === "completed") {
            // Task is completed; disappears per requirement!
            continue;
          }

          // Check if assigned to logged in user
          const isAssigned = isUserAssigned(row.assignedTo, userName);
          if (!isAssigned) continue;

          // Parse posting date
          const postDate = parseEntryDate(row.date);
          if (!postDate) continue;

          // Calculate days until posting:
          // e.g. for post on 2nd Nov and today is Oct 29 -> diff = 4
          const diffDays = getDaysDifference(postDate, now);

          // User specification:
          // "so 4 days before the posting which is 29,30,31,1 charmi should have a notification on top"
          // And until work is Done (including post day diff=0 and overdue diff >= -30)
          if (diffDays <= 4 && diffDays >= -30) {
            const currentWorkStatus = row.workStatus && row.workStatus.trim() ? row.workStatus.trim() : "Pending";
            
            // Format strictly as required: Client name : Content type : Work Status
            const message = `${client.clientName} : ${row.contentType} : ${currentWorkStatus}`;

            reminders.push({
              id: `${client._id}_${tabTitle}_${row.rowId || rIdx}`,
              clientId: client._id,
              clientName: client.clientName,
              tab: tabTitle,
              rowId: row.rowId || `row-${rIdx + 2}`,
              date: row.date,
              day: row.day,
              contentType: row.contentType,
              contentDetails: row.contentDetails || row.title || row.caption || "",
              workStatus: currentWorkStatus,
              uploadStatus: row.uploadStatus || "Pending",
              assignedTo: row.assignedTo,
              dataLink: row.dataLink || "",
              daysLeft: diffDays,
              message,
            });
          }
        }
      }
    } catch (err) {
      // Continue to next client if one fails
      continue;
    }
  }

  // Sort by daysLeft ascending (most imminent/overdue tasks first)
  reminders.sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    success: true,
    count: reminders.length,
    reminders,
  };
};

/**
 * Quick status updater (e.g. marking workStatus as "Done")
 * @param {string} clientId
 * @param {{ tab: string, rowId: string, workStatus?: string, uploadStatus?: string }} payload
 * @param {any} user
 * @returns {Promise<any>}
 */
export const updateCalendarEntryStatusService = async (
  clientId,
  { tab, rowId, workStatus, uploadStatus },
  user
) => {
  if (!tab || !rowId) {
    throw new AppError("Tab name and rowId are required", 400);
  }

  const updateData = {};
  if (workStatus !== undefined) updateData.workStatus = workStatus;
  if (uploadStatus !== undefined) updateData.uploadStatus = uploadStatus;

  const result = await updateCalendarEntryService(
    clientId,
    { tab, rowId, updateData },
    user
  );

  return {
    success: true,
    message: `Entry status updated to ${workStatus || uploadStatus}`,
    result,
  };
};
