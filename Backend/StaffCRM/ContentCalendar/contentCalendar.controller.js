import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../AuditLog/AuditLog.service.js";
import * as CalendarService from "./contentCalendar.service.js";

/**
 * Get calendar connection and sync status for a client.
 */
export const getCalendarStatus = asyncHandler(async (req, res) => {
  const status = await CalendarService.getCalendarStatusService(req.params.clientId);

  res.status(200).json({
    success: true,
    data: status,
  });
});

/**
 * Connect or update Google Spreadsheet URL for a client.
 */
export const connectSpreadsheet = asyncHandler(async (req, res) => {
  const { spreadsheetUrl } = req.body;
  const result = await CalendarService.connectSpreadsheetService(
    req.params.clientId,
    spreadsheetUrl,
    req.user
  );

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    module: "ContentCalendar",
    action: "CONNECT",
    entityId: req.params.clientId,
    description: `${req.user.name} connected Google Spreadsheet to client (${result.sheetTitle})`,
  });

  res.status(200).json({
    success: true,
    message: result.message,
    data: result,
  });
});

/**
 * Disconnect Google Spreadsheet.
 */
export const disconnectSpreadsheet = asyncHandler(async (req, res) => {
  const result = await CalendarService.disconnectSpreadsheetService(
    req.params.clientId,
    req.user
  );

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    module: "ContentCalendar",
    action: "DISCONNECT",
    entityId: req.params.clientId,
    description: `${req.user.name} disconnected Google Spreadsheet from client`,
  });

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Get available monthly and other tabs in the connected spreadsheet.
 */
export const getCalendarTabs = asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === "true";
  const result = await CalendarService.getCalendarTabsService(
    req.params.clientId,
    forceRefresh
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Create a new month tab in the connected spreadsheet.
 */
export const createMonthTab = asyncHandler(async (req, res) => {
  const { tabTitle } = req.body;
  const result = await CalendarService.createMonthTabService(
    req.params.clientId,
    tabTitle,
    req.user
  );

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    module: "ContentCalendar",
    action: "CREATE",
    entityId: req.params.clientId,
    description: `${req.user.name} created new month tab '${tabTitle}' in spreadsheet`,
  });

  res.status(201).json({
    success: true,
    message: `Month tab '${tabTitle}' created successfully`,
    data: result,
  });
});

/**
 * Get content calendar entries for a tab.
 */
export const getCalendarEntries = asyncHandler(async (req, res) => {
  const { tab, search, platform, status, contentType, workStatus, uploadStatus, refresh } = req.query;
  const forceRefresh = refresh === "true";

  const result = await CalendarService.getCalendarEntriesService(
    req.params.clientId,
    {
      tab,
      search,
      platform,
      status,
      contentType,
      workStatus,
      uploadStatus,
      forceRefresh,
    },
    false
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Create a new calendar entry in the sheet.
 */
export const createCalendarEntry = asyncHandler(async (req, res) => {
  const { tab, ...entryData } = req.body;

  const result = await CalendarService.createCalendarEntryService(
    req.params.clientId,
    {
      tab,
      entryData,
    },
    req.user
  );

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    module: "ContentCalendar",
    action: "CREATE",
    entityId: req.params.clientId,
    description: `${req.user.name} added calendar entry '${entryData.title || "Untitled"}' in tab '${tab}'`,
  });

  res.status(201).json({
    success: true,
    message: "Content entry created successfully in Google Sheets",
    data: result.createdRow,
  });
});

/**
 * Update an existing calendar entry in the sheet.
 */
export const updateCalendarEntry = asyncHandler(async (req, res) => {
  const { tab, ...updateData } = req.body;
  const { clientId, rowId } = req.params;

  const result = await CalendarService.updateCalendarEntryService(
    clientId,
    {
      tab,
      rowId,
      updateData,
    },
    req.user
  );

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    module: "ContentCalendar",
    action: "UPDATE",
    entityId: clientId,
    description: `${req.user.name} updated calendar entry '${rowId}' in tab '${tab}'`,
  });

  res.status(200).json({
    success: true,
    message: "Content entry updated successfully in Google Sheets",
    data: result.updatedRow,
  });
});

/**
 * Delete a calendar entry from the sheet.
 */
export const deleteCalendarEntry = asyncHandler(async (req, res) => {
  const { tab } = req.query;
  const { clientId, rowId } = req.params;

  const result = await CalendarService.deleteCalendarEntryService(
    clientId,
    {
      tab,
      rowId,
    },
    req.user
  );

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    module: "ContentCalendar",
    action: "DELETE",
    entityId: clientId,
    description: `${req.user.name} deleted calendar entry '${rowId}' from tab '${tab}'`,
  });

  res.status(200).json({
    success: true,
    message: "Content entry deleted successfully from Google Sheets",
    data: result,
  });
});

/**
 * Force refresh calendar data from Google Sheets.
 */
export const refreshCalendar = asyncHandler(async (req, res) => {
  const { tab } = req.query;
  CalendarService.invalidateCalendarCache(req.params.clientId);

  const tabs = await CalendarService.getCalendarTabsService(req.params.clientId, true);
  const entries = await CalendarService.getCalendarEntriesService(
    req.params.clientId,
    { tab: tab || tabs.selectedTab, forceRefresh: true },
    false
  );

  res.status(200).json({
    success: true,
    message: "Calendar refreshed directly from Google Sheets",
    data: {
      tabs: tabs.tabs,
      selectedTab: entries.tabTitle,
      entries: entries.entries,
      totalCount: entries.totalCount,
      lastSyncedAt: new Date(),
    },
  });
});

/**
 * Get pending content calendar reminders for the logged-in employee.
 * Triggered 4 days before posting date until work status is "Done".
 * Format: Client name : Content type : Work Status
 */
export const getMyCalendarReminders = asyncHandler(async (req, res) => {
  const result = await CalendarService.getUserCalendarRemindersService(req.user);

  res.status(200).json({
    success: true,
    count: result.count,
    data: result.reminders,
  });
});

/**
 * Quick status update for calendar entry (e.g. marking workStatus as "Done")
 */
export const updateCalendarEntryStatus = asyncHandler(async (req, res) => {
  const { clientId, rowId } = req.params;
  const { tab, workStatus, uploadStatus } = req.body;

  const result = await CalendarService.updateCalendarEntryStatusService(
    clientId,
    { tab, rowId, workStatus, uploadStatus },
    req.user
  );

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    module: "ContentCalendar",
    action: "UPDATE_STATUS",
    entityId: clientId,
    description: `${req.user.name} updated calendar entry '${rowId}' status in tab '${tab}' to workStatus='${workStatus || ""}'`,
  });

  res.status(200).json({
    success: true,
    message: result.message,
    data: result,
  });
});
