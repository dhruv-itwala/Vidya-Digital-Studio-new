import clientApi from "./clientAxios";

// Get client's content calendar status
export const getClientCalendarStatusAPI = () =>
  clientApi.get("/client-portal/content-calendar/status");

// Get client's available tabs
export const getClientCalendarTabsAPI = (refresh = false) =>
  clientApi.get("/client-portal/content-calendar/tabs", {
    params: { refresh: refresh ? "true" : "false" },
  });

// Get client's content calendar entries for a tab
export const getClientCalendarEntriesAPI = (params = {}) =>
  clientApi.get("/client-portal/content-calendar/entries", { params });

// Force refresh client calendar
export const refreshClientCalendarAPI = (tab) =>
  clientApi.post("/client-portal/content-calendar/refresh", null, {
    params: { tab },
  });
