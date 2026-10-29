import { google } from "googleapis";
import fs from "fs";
import path from "path";
import AppError from "../utils/AppError.js";

/**
 * Extract and validate Google Spreadsheet ID from various URL formats or raw ID.
 * @param {string} input - Google Sheets URL or Spreadsheet ID
 * @returns {string} - Extracted spreadsheet ID
 */
export const extractSpreadsheetId = (input) => {
  if (!input || typeof input !== "string") {
    throw new AppError("Spreadsheet URL or ID is required", 400);
  }

  const trimmed = input.trim();

  // Pattern 1: Standard Google Sheets URL
  // https://docs.google.com/spreadsheets/d/{spreadsheetId}/...
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // Pattern 2: Raw spreadsheet ID (typical length 25-60 characters, alphanumeric with - and _)
  const rawIdPattern = /^[a-zA-Z0-9-_]{20,80}$/;
  if (rawIdPattern.test(trimmed) && !trimmed.startsWith("http")) {
    return trimmed;
  }

  throw new AppError(
    "Invalid Google Spreadsheet URL. Please provide a valid URL like: https://docs.google.com/spreadsheets/d/{id}/edit",
    400
  );
};

/**
 * Check if Google Service Account credentials are configured in the environment.
 * @returns {boolean}
 */
export const isGoogleConfigured = () => {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return true;
  }
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return true;
  }
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  ) {
    return true;
  }
  return false;
};

/**
 * Get configured Service Account email address so employees can share spreadsheets with it.
 * @returns {string|null}
 */
export const getServiceAccountEmail = () => {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      return parsed.client_email || null;
    } catch {
      return null;
    }
  }

  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  ) {
    try {
      const content = fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8");
      const parsed = JSON.parse(content);
      return parsed.client_email || null;
    } catch {
      return null;
    }
  }

  return null;
};

/**
 * Get an authenticated Google Sheets API client.
 * @returns {Promise<import("googleapis").sheets_v4.Sheets>}
 */
export const getGoogleSheetsClient = async () => {
  const scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
  ];

  // Option 1: Explicit email and private key
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      // Handles escaped newlines in environment variables (e.g. "\\n" -> "\n")
      const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: privateKey,
        scopes,
      });

      await auth.authorize();
      return google.sheets({ version: "v4", auth });
    } catch (err) {
      console.error("Failed to authenticate Google JWT with email/key:", err.message);
      throw new AppError(
        `Google Service Account authentication failed: ${err.message}`,
        500
      );
    }
  }

  // Option 2: Full JSON string in GOOGLE_SERVICE_ACCOUNT_KEY
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key.replace(/\\n/g, "\n"),
        scopes,
      });

      await auth.authorize();
      return google.sheets({ version: "v4", auth });
    } catch (err) {
      console.error("Failed to parse/auth GOOGLE_SERVICE_ACCOUNT_KEY:", err.message);
      throw new AppError(
        `Failed to authenticate using GOOGLE_SERVICE_ACCOUNT_KEY: ${err.message}`,
        500
      );
    }
  }

  // Option 3: File path in GOOGLE_APPLICATION_CREDENTIALS
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  ) {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes,
      });

      return google.sheets({ version: "v4", auth });
    } catch (err) {
      console.error("Failed to authenticate using keyFile:", err.message);
      throw new AppError(
        `Google auth using credentials file failed: ${err.message}`,
        500
      );
    }
  }

  throw new AppError(
    "Google Sheets integration is not configured on the server. Please configure GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in your environment variables.",
    503
  );
};
