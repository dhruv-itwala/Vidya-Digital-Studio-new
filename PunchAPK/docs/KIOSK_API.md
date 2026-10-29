# VDS Kiosk API Documentation & Contract Specification

This document specifies the dedicated Kiosk API endpoints implemented in the VDS Master Backend to support the **VDS PunchAPK** Android attendance terminal.

---

## 1. Authentication & Security Headers

All requests to `/api/v1.0/kiosk/*` require the following HTTP headers:

| Header Name | Type | Description |
| :--- | :--- | :--- |
| `X-Kiosk-Device-Id` | String | Unique hardware terminal ID (e.g., `M32-KIOSK-01`). |
| `X-Kiosk-Device-Key` | String | Pre-shared or server-provisioned secret key for that device. |

If either header is missing, the backend returns:
```json
{
  "success": false,
  "message": "Unauthorized kiosk request: missing device credentials (X-Kiosk-Device-Id, X-Kiosk-Device-Key)"
}
```
HTTP Status: `401 Unauthorized`

If credentials do not match or are revoked:
```json
{
  "success": false,
  "message": "Unauthorized kiosk request: invalid or revoked device credentials"
}
```
HTTP Status: `401 Unauthorized`

---

## 2. API Endpoints

### 2.1 Fetch Kiosk Employee Directory & Live Status
- **Method:** `GET`
- **Route:** `/api/v1.0/kiosk/employees`
- **Query Parameters:**
  - `search` *(optional)*: String to filter employee names or designations.
  - `date` *(optional)*: `YYYY-MM-DD` (defaults to today in IST).
- **Security:** Returns only sanitized fields. Excludes `password`, `salary`, `phone`, `personalEmail`, `contactNo`, and `customPermissions`.
- **Response Format (200 OK):**
```json
{
  "success": true,
  "serverTime": "2026-10-29T14:15:00.000Z",
  "count": 2,
  "data": [
    {
      "id": "671234567890abcdef123456",
      "name": "Alex Johnson",
      "role": "employee",
      "designation": "Video Editor",
      "profilePicture": "https://res.cloudinary.com/.../alex.jpg",
      "status": "WORKING",
      "nextAllowedAction": "PUNCH_OUT",
      "punchIn": "2026-10-29T04:30:00.000Z",
      "punchOut": null,
      "workedSeconds": 14400,
      "isLateHalfDay": false
    },
    {
      "id": "671234567890abcdef123457",
      "name": "Priya Sharma",
      "role": "employee",
      "designation": "Graphic Designer",
      "profilePicture": null,
      "status": "NOT_STARTED",
      "nextAllowedAction": "PUNCH_IN",
      "punchIn": null,
      "punchOut": null,
      "workedSeconds": 0,
      "isLateHalfDay": false
    }
  ]
}
```

---

### 2.2 Fetch Single Employee Status
- **Method:** `GET`
- **Route:** `/api/v1.0/kiosk/employees/:id/status`
- **Path Parameters:**
  - `id`: MongoDB ObjectId string of the employee.
- **Response Format (200 OK):**
```json
{
  "success": true,
  "serverTime": "2026-10-29T14:15:00.000Z",
  "data": {
    "id": "671234567890abcdef123456",
    "name": "Alex Johnson",
    "role": "employee",
    "designation": "Video Editor",
    "profilePicture": "https://res.cloudinary.com/.../alex.jpg",
    "status": "WORKING",
    "nextAllowedAction": "PUNCH_OUT",
    "punchIn": "2026-10-29T04:30:00.000Z",
    "punchOut": null,
    "punches": [
      { "in": "2026-10-29T04:30:00.000Z", "out": null }
    ],
    "workedSeconds": 14400,
    "isLateHalfDay": false
  }
}
```

---

### 2.3 Record Kiosk Punch In
- **Method:** `POST`
- **Route:** `/api/v1.0/kiosk/punch-in`
- **Request Payload:**
```json
{
  "employeeId": "671234567890abcdef123457",
  "idempotencyKey": "a8b7c6d5-e4f3-4210-9876-543210fedcba",
  "clientTimestamp": "2026-10-29T14:15:01.000Z"
}
```
- **Business Logic Enforced:**
  1. Validates employee is active in database.
  2. Enforces existing holiday check (rejects if today is holiday).
  3. Enforces open session check (rejects if already punched in without punch out).
  4. Enforces strict 10:30 AM IST cutoff (automatically marks `HALF_DAY` if after 10:30 AM).
  5. Supports multi-session punching (appends new `{ in: now, out: null }` to `punches`).
  6. Logs to master `AuditLog` collection.
- **Response Format (200 OK):**
```json
{
  "success": true,
  "message": "Punch In recorded successfully",
  "serverTime": "2026-10-29T14:15:02.120Z",
  "data": {
    "employeeId": "671234567890abcdef123457",
    "name": "Priya Sharma",
    "punchIn": "2026-10-29T14:15:02.120Z",
    "status": "WORKING",
    "isLateHalfDay": false
  }
}
```

---

### 2.4 Record Kiosk Punch Out
- **Method:** `POST`
- **Route:** `/api/v1.0/kiosk/punch-out`
- **Request Payload:**
```json
{
  "employeeId": "671234567890abcdef123456",
  "idempotencyKey": "f1e2d3c4-b5a6-4789-0123-456789abcdef",
  "clientTimestamp": "2026-10-29T18:00:01.000Z"
}
```
- **Business Logic Enforced:**
  1. Finds today's or yesterday's open work record.
  2. Rejects if user has not punched in.
  3. Rejects if already punched out.
  4. Rejects if auto-closed at midnight as `INCOMPLETE` (requires HR override).
  5. Closes active punch and any open breaks.
  6. Calculates net work minutes, overtime, and updates `Attendance` table.
  7. Logs to master `AuditLog` collection.
- **Response Format (200 OK):**
```json
{
  "success": true,
  "message": "Punch Out recorded successfully",
  "serverTime": "2026-10-29T18:00:02.450Z",
  "data": {
    "employeeId": "671234567890abcdef123456",
    "name": "Alex Johnson",
    "punchIn": "2026-10-29T04:30:00.000Z",
    "punchOut": "2026-10-29T18:00:02.450Z",
    "netWorkMinutes": 480,
    "attendanceStatus": "PRESENT"
  }
}
```

---

## 3. Device Provisioning & Revocation

Device credentials are configured in `Backend/StaffCRM/Kiosk/kioskDevice.config.js` and can be overridden via environment variables without requiring code redeployments:

```bash
# Comma-separated list of approved terminal ID and secret key pairs:
KIOSK_DEVICE_KEYS="M32-KIOSK-01:vds_kiosk_secret_m32_dev_2026,M32-KIOSK-02:sec_prod_reception_9882a"
```

To **revoke a kiosk terminal immediately**, remove its entry from `KIOSK_DEVICE_KEYS` or rotate its secret key.

