import { asyncHandler } from "../utils/asyncHandler.js";
import * as CalendarService from "./contentCalendar.service.js";

/**
 * Get calendar connection status for authenticated client.
 * Strictly uses req.client.id - ignores any client ID from params or body.
 */
export const getClientCalendarStatus = asyncHandler(async (req, res) => {
  const clientId = req.client.id;
  const status = await CalendarService.getCalendarStatusService(clientId);

  // Filter out internal sensitive fields for client
  res.status(200).json({
    success: true,
    data: {
      isConnected: status.isConnected,
      status: status.status,
      sheetTitle: status.sheetTitle,
      lastSyncedAt: status.lastSyncedAt,
    },
  });
});

/**
 * Get available monthly tabs for authenticated client.
 */
export const getClientCalendarTabs = asyncHandler(async (req, res) => {
  const clientId = req.client.id;
  const forceRefresh = req.query.refresh === "true";

  const result = await CalendarService.getCalendarTabsService(clientId, forceRefresh);

  res.status(200).json({
    success: true,
    data: {
      sheetTitle: result.sheetTitle,
      tabs: result.tabs,
      selectedTab: result.selectedTab,
      lastSyncedAt: result.lastSyncedAt,
    },
  });
});

/**
 * Get calendar entries for authenticated client (Strictly Read-Only).
 * Strips internal employee notes and assignments.
 */
export const getClientCalendarEntries = asyncHandler(async (req, res) => {
  const clientId = req.client.id;
  const { tab, search, platform, status, contentType, workStatus, uploadStatus, refresh } = req.query;
  const forceRefresh = refresh === "true";

  const result = await CalendarService.getCalendarEntriesService(
    clientId,
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
    true // isClientPortal = true (strips internal notes)
  );

  res.status(200).json({
    success: true,
    data: {
      tabTitle: result.tabTitle,
      sheetTitle: result.sheetTitle,
      entries: result.entries,
      totalCount: result.totalCount,
      lastSyncedAt: result.lastSyncedAt,
    },
  });
});

/**
 * Client manual refresh action.
 */
export const refreshClientCalendar = asyncHandler(async (req, res) => {
  const clientId = req.client.id;
  const { tab } = req.query;

  CalendarService.invalidateCalendarCache(clientId);

  const tabs = await CalendarService.getCalendarTabsService(clientId, true);
  const entries = await CalendarService.getCalendarEntriesService(
    clientId,
    { tab: tab || tabs.selectedTab, forceRefresh: true },
    true
  );

  res.status(200).json({
    success: true,
    message: "Calendar refreshed successfully",
    data: {
      tabs: tabs.tabs,
      selectedTab: entries.tabTitle,
      entries: entries.entries,
      totalCount: entries.totalCount,
      lastSyncedAt: new Date(),
    },
  });
});
