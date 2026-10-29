# Google Sheets Content Calendar Integration Setup Guide

This guide explains how to configure and use the Google Sheets Content Calendar integration for **Vidya Digital Studio**.

---

## 1. Google Cloud Service Account Setup

To allow the CRM and Client Portal to communicate with Google Sheets securely from the backend without requiring clients to grant OAuth tokens, we use a **Google Cloud Service Account**.

### Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `vidya-digital-studio-portal`).

### Step 2: Enable Google Sheets & Drive APIs
1. In the Google Cloud Console, navigate to **APIs & Services > Library**.
2. Search for **Google Sheets API** and click **Enable**.
3. Search for **Google Drive API** and click **Enable**.

### Step 3: Create a Service Account
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials** and select **Service Account**.
3. Enter a Service Account Name (e.g., `vds-sheets-service-account`).
4. Click **Create and Continue**, then click **Done**.

### Step 4: Generate Service Account Key
1. Click on the created service account email (e.g., `vds-sheets-service-account@vidya-digital-studio-portal.iam.gserviceaccount.com`).
2. Go to the **Keys** tab.
3. Click **Add Key > Create new key**.
4. Choose **JSON** format and click **Create**. The JSON file will download to your computer.

---

## 2. Backend Environment Variables Configuration

Open `Backend/.env` and add the service account credentials:

### Method A: Email & Private Key (Recommended)
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```
*(Note: Ensure line breaks in the private key are formatted as `\n` enclosed in quotes)*

### Method B: Raw JSON String (Alternative)
```env
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"..."}'
```

### Method C: Credentials File Path (Alternative)
```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

---

## 3. Spreadsheet Sharing Instructions

For the backend to access and update a client's spreadsheet:
1. Open the Google Spreadsheet in Google Sheets.
2. Click the **Share** button in the top right.
3. Add the Service Account email address:
   `your-service-account@your-project.iam.gserviceaccount.com`
4. Set permission to **Editor**.
5. Uncheck "Notify people" (since service accounts don't have mailboxes) and click **Share**.

---

## 4. Spreadsheet Organization & Column Headers

The system dynamically discovers tabs and normalizes headers using intelligent synonym matching.

### Recommended Tab Names:
- Monthly tabs: `January`, `February 2026`, `October 2026`, `Nov 2026`, `Content Calendar Oct`, etc.
- Non-month tabs are preserved and accessible (e.g., `Guidelines`, `Templates`).

### Supported Header Synonyms (Case-Insensitive):
| Canonical Field | Recognized Headers / Synonyms |
| --- | --- |
| `id` | `Content ID`, `ID`, `Post ID`, `VDS ID` |
| `date` | `Publish Date`, `Date`, `Post Date`, `Scheduled Date`, `Day` |
| `time` | `Time`, `Publish Time`, `Posting Time`, `Scheduled Time`, `Slot` |
| `platform` | `Platform`, `Channel`, `Social Media`, `Network` |
| `contentType` | `Post Type`, `Content Type`, `Format`, `Content Format`, `Type` |
| `title` | `Topic / Title`, `Title`, `Topic`, `Headline`, `Subject`, `Concept` |
| `caption` | `Caption`, `Post Copy`, `Copy`, `Caption / Script`, `Script`, `Text` |
| `hashtags` | `Hashtags`, `Tags`, `Tags / Hashtags` |
| `creativeUrl` | `Creative URL`, `Creative Link`, `Media Link`, `Design Link`, `Asset Link` |
| `referenceUrl` | `Reference URL`, `Inspiration`, `Benchmark`, `Reference` |
| `status` | `Status`, `Content Status`, `Post Status`, `Stage`, `State` |
| `approvalStatus` | `Approval Status`, `Client Approval`, `Approval` |
| `assignedTo` | `Assigned To`, `Assignee`, `Assigned Employee` |
| `notes` | `Notes`, `Internal Notes`, `Comments`, `Remarks` *(Hidden from clients)* |
| `publishedUrl` | `Published URL`, `Live URL`, `Post Link`, `Live Link` |

---

## 5. Security Architecture

1. **Client Isolation**:
   - The Client Portal communicates through `/api/v1.0/client-portal/content-calendar/*`.
   - The authenticated client's identity is strictly resolved from `req.client.id` in the JWT token.
   - Clients cannot pass another client's ID or access another client's data.

2. **Strict Read-Only for Clients**:
   - Clients have zero mutating endpoints (no create, edit, delete, or connect endpoints).
   - Internal employee notes (`notes`) and assignees (`assignedTo`) are automatically stripped before sending data to clients.

3. **Concurrency & Safe Row Identification**:
   - The backend avoids fragile row-index reliance.
   - Each row is assigned a unique stable content ID.
   - When updating or deleting an entry, the backend locates the row by ID immediately before writing, preventing accidental overwrites caused by reordering or sorting.

4. **Zero Iframes**:
   - Data is rendered natively with rich interactive views (Calendar Grid, Cards, and Tables) matching the client portal design.
