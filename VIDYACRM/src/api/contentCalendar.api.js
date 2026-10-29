import api from "./axios";

// Get Google Sheets calendar connection and sync status
export const getCalendarStatusAPI = (clientId) =>
  api.get(`/content-calendar/client/${clientId}/status`);

// Connect or update Google Spreadsheet URL
export const connectSpreadsheetAPI = (clientId, spreadsheetUrl) =>
  api.post(`/content-calendar/client/${clientId}/connect`, { spreadsheetUrl });

// Disconnect Google Spreadsheet
export const disconnectSpreadsheetAPI = (clientId) =>
  api.post(`/content-calendar/client/${clientId}/disconnect`);

// Get discovered tabs
export const getCalendarTabsAPI = (clientId, refresh = false) =>
  api.get(`/content-calendar/client/${clientId}/tabs`, {
    params: { refresh: refresh ? "true" : "false" },
  });

// Create a new month tab in Google Sheets
export const createMonthTabAPI = (clientId, tabTitle) =>
  api.post(`/content-calendar/client/${clientId}/tabs`, { tabTitle });

// Get content entries for a tab with filtering
export const getCalendarEntriesAPI = (clientId, params = {}) =>
  api.get(`/content-calendar/client/${clientId}/entries`, { params });

// Create a new content entry in Google Sheets
export const createCalendarEntryAPI = (clientId, data) =>
  api.post(`/content-calendar/client/${clientId}/entries`, data);

// Update an existing content entry in Google Sheets
export const updateCalendarEntryAPI = (clientId, rowId, data) =>
  api.patch(`/content-calendar/client/${clientId}/entries/${rowId}`, data);

// Delete a content entry row in Google Sheets
export const deleteCalendarEntryAPI = (clientId, rowId, tab) =>
  api.delete(`/content-calendar/client/${clientId}/entries/${rowId}`, {
    params: { tab },
  });

// Force refresh calendar data from Google Sheets
export const refreshCalendarAPI = (clientId, tab) =>
  api.post(`/content-calendar/client/${clientId}/refresh`, null, {
    params: { tab },
  });

// Get content calendar reminders for logged-in user
export const getMyCalendarRemindersAPI = () =>
  api.get("/content-calendar/my-reminders");

// Quick update status of calendar entry (e.g. marking workStatus as "Done")
export const updateCalendarEntryStatusAPI = (clientId, rowId, data) =>
  api.patch(`/content-calendar/client/${clientId}/entries/${rowId}/status`, data);
