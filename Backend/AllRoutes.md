# Vidya Digital Studio — Complete Backend API Directory

> **Base Server URL:** `http://localhost:2025/api/v1.0` (or `http://<LAN_IP>:2025/api/v1.0`)
> **Environment Version:** `v1.0`
> **Authentication Scheme:** Bearer Token JWT (`Authorization: Bearer <TOKEN>`)

## Table of Contents

- [Root & Health](#root-health)
- [Service Pricing](#service-pricing)
- [Quotations](#quotations)
- [Invoices](#invoices)
- [WhatsApp CRM](#whatsapp-crm)
- [Users & Authentication](#users-authentication)
- [Attendance Management](#attendance-management)
- [Kiosk Attendance](#kiosk-attendance)
- [Holidays](#holidays)
- [Leaves](#leaves)
- [Reports](#reports)
- [Tasks Management](#tasks-management)
- [To-Do List](#to-do-list)
- [Announcements & Notices](#announcements-notices)
- [Targets & Goals](#targets-goals)
- [System Settings](#system-settings)
- [Clients CRM](#clients-crm)
- [Client Portal](#client-portal)
- [Content Tasks](#content-tasks)
- [Content Calendar (Google Sheets)](#content-calendar-google-sheets-)
- [Content Calendar (Client View)](#content-calendar-client-view-)
- [Leads CRM](#leads-crm)
- [Influencers CRM](#influencers-crm)
- [UGC Creators CRM](#ugc-creators-crm)
- [Audit Logs](#audit-logs)
- [Notifications](#notifications)
- [Tickets & Helpdesk](#tickets-helpdesk)
- [Payroll Management](#payroll-management)

---

### Root & Health
* **File:** `server.js`
* **Prefix:** `/`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/${VERSION}` | Public | Routes |
| **`GET`** | `/ping` | Public | Health Check Route |

### Service Pricing
* **File:** `Quotation/ServicePrices/ServicePrice.routes.js`
* **Prefix:** `/api/v1.0/service-prices`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1.0/service-prices` | Public | GET all services |
| **`GET`** | `/api/v1.0/service-prices/:category` | Public | GET by category |

### Quotations
* **File:** `Quotation/Quote/routes/Quote.routes.js`
* **Prefix:** `/api/v1.0/quotation`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1.0/quotation/pdf/generate` | Public | Create quote (`createQuote`) |
| **`GET`** | `/api/v1.0/quotation/:id` | Public | Get quote (`getQuote`) |
| **`GET`** | `/api/v1.0/quotation` | Public | List quotes (`listQuotes`) |
| **`DELETE`** | `/api/v1.0/quotation/:id` | Public | Delete quote (`deleteQuote`) |
| **`POST`** | `/api/v1.0/quotation/pdf/test` | Public | Test pdf (`testPdf`) |

### Invoices
* **File:** `Invoice/routes/Invoice.routes.js`
* **Prefix:** `/api/v1.0/invoice`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1.0/invoice/auth/login` | Public | Allows CRM Admin / HR to login using their CRM ID (email or phone) & password |
| **`GET`** | `/api/v1.0/invoice/auth/me` | 🔐 Authenticated<br/>`admin, hr` | Session validation / current profile |
| **`GET`** | `/api/v1.0/invoice/next-number` | 🔐 Authenticated<br/>`admin, hr` | Invoice management endpoints |
| **`GET`** | `/api/v1.0/invoice/clients` | 🔐 Authenticated<br/>`admin, hr` | Get clients for invoice (`getClientsForInvoice`) |
| **`POST`** | `/api/v1.0/invoice/generate` | 🔐 Authenticated<br/>`admin, hr` | Generate invoice (`generateInvoice`) |
| **`POST`** | `/api/v1.0/invoice/preview` | 🔐 Authenticated<br/>`admin, hr` | Preview invoice pdf (`previewInvoicePdf`) |
| **`GET`** | `/api/v1.0/invoice` | 🔐 Authenticated<br/>`admin, hr` | List invoices (`listInvoices`) |
| **`GET`** | `/api/v1.0/invoice/:id` | 🔐 Authenticated<br/>`admin, hr` | Get invoice by id (`getInvoiceById`) |
| **`PUT`** | `/api/v1.0/invoice/:id` | 🔐 Authenticated<br/>`admin, hr` | Update & regenerate invoice (`updateInvoice`) |
| **`DELETE`** | `/api/v1.0/invoice/:id` | 🔐 Authenticated<br/>`admin, hr` | Delete invoice (`deleteInvoice`) |

### WhatsApp CRM
* **File:** `Whatsapp/whatsapp.route.js`
* **Prefix:** `/api/v1.0/whatsapp`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1.0/whatsapp/webhook` | Public | Webhook |
| **`POST`** | `/api/v1.0/whatsapp/webhook` | Public | Receive message (`receiveMessage`) |
| **`GET`** | `/api/v1.0/whatsapp/media/:mediaId` | Public | Media Streaming Proxy |
| **`GET`** | `/api/v1.0/whatsapp/conversations` | 🔐 Authenticated<br/>`admin, hr` | Conversation History & Chat Management (Admin, HR, Administrative) |
| **`GET`** | `/api/v1.0/whatsapp/conversations/:phone/messages` | 🔐 Authenticated<br/>`admin, hr` | Role check (`roleCheck`) |
| **`POST`** | `/api/v1.0/whatsapp/conversations/:phone/send` | 🔐 Authenticated<br/>`admin, hr` | Role check (`roleCheck`) |

### Users & Authentication
* **File:** `StaffCRM/Users/user.routes.js`
* **Prefix:** `/api/v1.0/users`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1.0/users/login` | Public | Login (`login`) |
| **`PUT`** | `/api/v1.0/users/preferences` | 🔐 Authenticated<br/>`admin, hr` | Update notification preferences (`updateNotificationPreferences`) |
| **`GET`** | `/api/v1.0/users/me` | 🔐 Authenticated | Get profile (`getProfile`) |
| **`GET`** | `/api/v1.0/users` | 🔐 Authenticated | Get all users (`getAllUsers`) |
| **`GET`** | `/api/v1.0/users/birthdays` | 🔐 Authenticated | Get employee birthdays (`getEmployeeBirthdays`) |
| **`GET`** | `/api/v1.0/users/dashboard` | 🔐 Authenticated | Get dashboard overview (`getDashboardOverview`) |
| **`GET`** | `/api/v1.0/users/admin/all` | 🔐 Authenticated<br/>`admin, hr` | Get all users for admin (`getAllUsersForAdmin`) |
| **`POST`** | `/api/v1.0/users` | 🔐 Authenticated<br/>`admin, hr` | Create user (`createUser`) |
| **`PUT`** | `/api/v1.0/users/:id` | 🔐 Authenticated<br/>`admin, hr` | Update user (`updateUser`) |
| **`PATCH`** | `/api/v1.0/users/:id/inactive` | 🔐 Authenticated<br/>`admin, hr` | Inactive user (`inactiveUser`) |
| **`DELETE`** | `/api/v1.0/users/:id` | 🔐 Authenticated<br/>`admin, hr` | Delete user (`deleteUser`) |

### Attendance Management
* **File:** `StaffCRM/Attendance/attendance.routes.js`
* **Prefix:** `/api/v1.0/attendance`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1.0/attendance/wifi-check` | Public | Async (`async`) |
| **`GET`** | `/api/v1.0/attendance/my-ip` | Public | Async (`async`) |
| **`GET`** | `/api/v1.0/attendance/work-record/today` | 🔐 Authenticated | Get today work record (`getTodayWorkRecord`) |
| **`POST`** | `/api/v1.0/attendance/punch-in` | 🔐 Authenticated | Require office wifi (`requireOfficeWifi`) |
| **`POST`** | `/api/v1.0/attendance/punch-out` | 🔐 Authenticated | Require office wifi (`requireOfficeWifi`) |
| **`POST`** | `/api/v1.0/attendance/break-in` | 🔐 Authenticated | Break in (`breakIn`) |
| **`POST`** | `/api/v1.0/attendance/break-out` | 🔐 Authenticated | Break out (`breakOut`) |
| **`GET`** | `/api/v1.0/attendance/my` | 🔐 Authenticated | My attendance (`myAttendance`) |
| **`GET`** | `/api/v1.0/attendance/my/date` | 🔐 Authenticated | My attendance by date (`myAttendanceByDate`) |
| **`GET`** | `/api/v1.0/attendance/day` | 🔐 Authenticated<br/>`admin` | Day attendance (`dayAttendance`) |
| **`GET`** | `/api/v1.0/attendance/weekly-progress` | 🔐 Authenticated | Get weekly progress (`getWeeklyProgress`) |

### Kiosk Attendance
* **File:** `StaffCRM/Kiosk/kiosk.routes.js`
* **Prefix:** `/api/v1.0/kiosk`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1.0/kiosk/employees` | Public | Get kiosk employees (`getKioskEmployees`) |
| **`GET`** | `/api/v1.0/kiosk/employees/:id/status` | Public | Get kiosk employee status (`getKioskEmployeeStatus`) |
| **`POST`** | `/api/v1.0/kiosk/punch-in` | Public | Kiosk punch in (`kioskPunchIn`) |
| **`POST`** | `/api/v1.0/kiosk/punch-out` | Public | Kiosk punch out (`kioskPunchOut`) |

### Holidays
* **File:** `StaffCRM/Holidays/holiday.routes.js`
* **Prefix:** `/api/v1.0/holiday`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1.0/holiday` | 🔐 Authenticated | Get holidays (`getHolidays`) |
| **`GET`** | `/api/v1.0/holiday/employee` | 🔐 Authenticated | Get upcoming holidays (`getUpcomingHolidays`) |
| **`POST`** | `/api/v1.0/holiday` | 🔐 Authenticated<br/>`admin, hr` | Create holiday (`createHoliday`) |
| **`PUT`** | `/api/v1.0/holiday/:id` | 🔐 Authenticated<br/>`admin, hr` | Update holiday (`updateHoliday`) |
| **`DELETE`** | `/api/v1.0/holiday/:id` | 🔐 Authenticated<br/>`admin, hr` | Delete holiday (`deleteHoliday`) |

### Leaves
* **File:** `StaffCRM/Leaves/leave.routes.js`
* **Prefix:** `/api/v1.0/leave`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1.0/leave/apply` | 🔐 Authenticated | Employee |
| **`GET`** | `/api/v1.0/leave/my` | 🔐 Authenticated | My leaves (`myLeaves`) |
| **`POST`** | `/api/v1.0/leave/:id/cancel` | 🔐 Authenticated | Cancel leave (`cancelLeave`) |
| **`GET`** | `/api/v1.0/leave/summary` | 🔐 Authenticated | Leave summary (`leaveSummary`) |
| **`GET`** | `/api/v1.0/leave/balance` | 🔐 Authenticated | Get leave balance (`getLeaveBalance`) |
| **`GET`** | `/api/v1.0/leave/all` | 🔐 Authenticated | All leaves (`allLeaves`) |
| **`POST`** | `/api/v1.0/leave/:id/approve` | 🔐 Authenticated<br/>`admin, hr` | Both Admin and HR can access these routes |
| **`POST`** | `/api/v1.0/leave/:id/decline` | 🔐 Authenticated<br/>`admin, hr` | Decline leave (`declineLeave`) |

### Reports
* **File:** `StaffCRM/Report/report.routes.js`
* **Prefix:** `/api/v1.0/reports`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1.0/reports/submit` | 🔐 Authenticated | Submit report (`submitReport`) |
| **`PUT`** | `/api/v1.0/reports/update/:id` | 🔐 Authenticated | Update report (`updateReport`) |
| **`GET`** | `/api/v1.0/reports/my` | 🔐 Authenticated | My reports (`myReports`) |
| **`GET`** | `/api/v1.0/reports/my/date` | 🔐 Authenticated | Get my reports by date (`getMyReportsByDate`) |
| **`GET`** | `/api/v1.0/reports/all` | 🔐 Authenticated<br/>`admin, hr` | All reports (`allReports`) |

### Tasks Management
* **File:** `StaffCRM/Tasks/task.routes.js`
* **Prefix:** `/api/v1.0/tasks`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1.0/tasks` | 🔐 Authenticated | Create task (`createTask`) |
| **`GET`** | `/api/v1.0/tasks/my` | 🔐 Authenticated | My tasks (`myTasks`) |
| **`PATCH`** | `/api/v1.0/tasks/:id/status` | 🔐 Authenticated | Update task status (`updateTaskStatus`) |
| **`PATCH`** | `/api/v1.0/tasks/:id` | 🔐 Authenticated | Update task (`updateTask`) |
| **`DELETE`** | `/api/v1.0/tasks/:id` | 🔐 Authenticated | Delete task (`deleteTask`) |
| **`GET`** | `/api/v1.0/tasks/my/completed` | 🔐 Authenticated | My completed tasks (`myCompletedTasks`) |
| **`GET`** | `/api/v1.0/tasks/all` | 🔐 Authenticated<br/>`admin, hr` | Admin |

### To-Do List
* **File:** `StaffCRM/Todo/todo.routes.js`
* **Prefix:** `/api/v1.0/todo`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1.0/todo/today` | 🔐 Authenticated | Get today todo (`getTodayTodo`) |
| **`GET`** | `/api/v1.0/todo/:date` | 🔐 Authenticated | Get todo by date (`getTodoByDate`) |
| **`POST`** | `/api/v1.0/todo/item` | 🔐 Authenticated | Add todo item (`addTodoItem`) |
| **`PATCH`** | `/api/v1.0/todo/item/:itemId` | 🔐 Authenticated | Toggle todo item (`toggleTodoItem`) |
| **`DELETE`** | `/api/v1.0/todo/item/:itemId` | 🔐 Authenticated | Delete todo item (`deleteTodoItem`) |

### Announcements & Notices
* **File:** `StaffCRM/Announcements/Announcement.routes.js`
* **Prefix:** `/api/v1.0/announcements`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1.0/announcements` | 🔐 Authenticated | Everyone can view active announcements |

### Targets & Goals
* **File:** `StaffCRM/Targets/Target.routes.js`
* **Prefix:** `/api/v1.0/targets`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1.0/targets/my-targets` | 🔐 Authenticated | Get my targets (`getMyTargets`) |
| **`POST`** | `/api/v1.0/targets` | 🔐 Authenticated<br/>`admin, hr, administrative` | Admins / HR / Administrative can view and set targets |
| **`GET`** | `/api/v1.0/targets/:userId` | 🔐 Authenticated<br/>`admin, hr, administrative` | Role check (`roleCheck`) |

### System Settings
* **File:** `StaffCRM/Settings/SystemSettings.routes.js`
* **Prefix:** `/api/v1.0/settings`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1.0/settings` | 🔐 Authenticated<br/>`admin, hr, administrative` | Role check (`roleCheck`) |
| **`PUT`** | `/api/v1.0/settings` | 🔐 Authenticated<br/>`admin, hr, administrative` | Role check (`roleCheck`) |

### Clients CRM
* **File:** `StaffCRM/Clients/Client.routes.js`
* **Prefix:** `/api/v1.0/clients`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1.0/clients` | 🔐 Authenticated<br/>`[admin, hr], clients_manage` | Create Client (with optional profile image) |
| **`GET`** | `/api/v1.0/clients` | 🔐 Authenticated<br/>`[admin, hr], clients_manage` | Get All Clients |
| **`GET`** | `/api/v1.0/clients/:id` | 🔐 Authenticated<br/>`[admin, hr], clients_manage` | Get Single Client |
| **`PATCH`** | `/api/v1.0/clients/:id` | 🔐 Authenticated<br/>`[admin, hr], clients_manage` | Update Client |
| **`PATCH`** | `/api/v1.0/clients/:id/toggle` | 🔐 Authenticated<br/>`[admin, hr], clients_manage` | Toggle Client Status (Active/Inactive) |
| **`DELETE`** | `/api/v1.0/clients/:id` | 🔐 Authenticated<br/>`[admin, hr], clients_manage` | Delete Client |

### Client Portal
* **File:** `StaffCRM/Clients/ClientPortal.routes.js`
* **Prefix:** `/api/v1.0/client-portal`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1.0/client-portal/login` | Public | Public routes for clients |
| **`GET`** | `/api/v1.0/client-portal/me` | 👤 Client Portal | Get client dashboard (`getClientDashboard`) |
| **`GET`** | `/api/v1.0/client-portal/me/credentials` | 👤 Client Portal | Get client credentials (`getClientCredentials`) |

### Content Tasks
* **File:** `StaffCRM/Tasks/ContentTask.routes.js`
* **Prefix:** `/api/v1.0/content-tasks`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1.0/content-tasks` | 🔐 Authenticated | CRUD for content tasks |
| **`GET`** | `/api/v1.0/content-tasks` | 🔐 Authenticated | Get all content tasks (`getAllContentTasks`) |
| **`GET`** | `/api/v1.0/content-tasks/client/:clientId` | 🔐 Authenticated | Get client content tasks (`getClientContentTasks`) |
| **`PATCH`** | `/api/v1.0/content-tasks/:id` | 🔐 Authenticated | Update content task (`updateContentTask`) |
| **`DELETE`** | `/api/v1.0/content-tasks/:id` | 🔐 Authenticated | Delete content task (`deleteContentTask`) |

### Content Calendar (Google Sheets)
* **File:** `StaffCRM/ContentCalendar/contentCalendar.routes.js`
* **Prefix:** `/api/v1.0/content-calendar`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1.0/content-calendar/my-reminders` | 🔐 Authenticated | Employee Content Reminders (4 days before posting until marked Done) |
| **`PATCH`** | `/api/v1.0/content-calendar/client/:clientId/entries/:rowId/status` | 🔐 Authenticated | Quick status update (e.g. marking workStatus as "Done") |
| **`GET`** | `/api/v1.0/content-calendar/client/:clientId/status` | 🔐 Authenticated | Status & Read routes: open to authorized staff (admin, hr, employee, intern) |
| **`GET`** | `/api/v1.0/content-calendar/client/:clientId/tabs` | 🔐 Authenticated | Get calendar tabs (`getCalendarTabs`) |
| **`POST`** | `/api/v1.0/content-calendar/client/:clientId/tabs` | 🔐 Authenticated | Create month tab (`createMonthTab`) |
| **`GET`** | `/api/v1.0/content-calendar/client/:clientId/entries` | 🔐 Authenticated | Get calendar entries (`getCalendarEntries`) |
| **`POST`** | `/api/v1.0/content-calendar/client/:clientId/refresh` | 🔐 Authenticated | Refresh calendar (`refreshCalendar`) |
| **`POST`** | `/api/v1.0/content-calendar/client/:clientId/entries` | 🔐 Authenticated | Content Management routes (create, update, delete entries) |
| **`PATCH`** | `/api/v1.0/content-calendar/client/:clientId/entries/:rowId` | 🔐 Authenticated | Update calendar entry (`updateCalendarEntry`) |
| **`DELETE`** | `/api/v1.0/content-calendar/client/:clientId/entries/:rowId` | 🔐 Authenticated | Delete calendar entry (`deleteCalendarEntry`) |

### Content Calendar (Client View)
* **File:** `StaffCRM/ContentCalendar/contentCalendarClient.routes.js`
* **Prefix:** `/api/v1.0/client-portal/content-calendar`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1.0/client-portal/content-calendar/status` | 👤 Client Portal | Read-only endpoints |
| **`GET`** | `/api/v1.0/client-portal/content-calendar/tabs` | 👤 Client Portal | Get client calendar tabs (`getClientCalendarTabs`) |
| **`GET`** | `/api/v1.0/client-portal/content-calendar/entries` | 👤 Client Portal | Get client calendar entries (`getClientCalendarEntries`) |
| **`POST`** | `/api/v1.0/client-portal/content-calendar/refresh` | 👤 Client Portal | Refresh client calendar (`refreshClientCalendar`) |

### Leads CRM
* **File:** `StaffCRM/Leads/Lead.routes.js`
* **Prefix:** `/api/v1.0/leads`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1.0/leads` | 🔐 Authenticated<br/>`[admin, hr], leads_manage` | Create Lead |
| **`GET`** | `/api/v1.0/leads` | 🔐 Authenticated<br/>`[admin, hr], leads_manage` | Get All Leads (with filters) |
| **`GET`** | `/api/v1.0/leads/:id` | 🔐 Authenticated<br/>`[admin, hr], leads_manage` | Get Single Lead |
| **`PATCH`** | `/api/v1.0/leads/:id` | 🔐 Authenticated<br/>`[admin, hr], leads_manage` | Update Lead |
| **`DELETE`** | `/api/v1.0/leads/:id` | 🔐 Authenticated<br/>`[admin, hr], leads_manage` | Role or permission check (`roleOrPermissionCheck`) |
| **`POST`** | `/api/v1.0/leads/:id/meeting-note` | 🔐 Authenticated<br/>`[admin, hr], leads_manage` | Add meeting note (`addMeetingNote`) |
| **`PATCH`** | `/api/v1.0/leads/:id/status` | 🔐 Authenticated<br/>`[admin, hr], leads_manage` | Update lead status (`updateLeadStatus`) |
| **`PATCH`** | `/api/v1.0/leads/:id/proposal` | 🔐 Authenticated<br/>`[admin, hr], leads_manage` | Update lead proposal (`updateLeadProposal`) |
| **`POST`** | `/api/v1.0/leads/:id/convert` | 🔐 Authenticated<br/>`[admin, hr], leads_manage` | Role or permission check (`roleOrPermissionCheck`) |

### Influencers CRM
* **File:** `StaffCRM/Influencers/Influencers.routes.js`
* **Prefix:** `/api/v1.0/influencers`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1.0/influencers` | 🔐 Authenticated | Create (`create`) |
| **`GET`** | `/api/v1.0/influencers` | 🔐 Authenticated | Get all (`getAll`) |
| **`PUT`** | `/api/v1.0/influencers/:id` | 🔐 Authenticated | Update (`update`) |
| **`DELETE`** | `/api/v1.0/influencers/:id` | 🔐 Authenticated | Remove (`remove`) |

### UGC Creators CRM
* **File:** `StaffCRM/UGCCreators/UGCCreators.routes.js`
* **Prefix:** `/api/v1.0/ugccreators`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1.0/ugccreators` | 🔐 Authenticated | Create (`create`) |
| **`GET`** | `/api/v1.0/ugccreators` | 🔐 Authenticated | Get all (`getAll`) |
| **`PUT`** | `/api/v1.0/ugccreators/:id` | 🔐 Authenticated | Update (`update`) |
| **`DELETE`** | `/api/v1.0/ugccreators/:id` | 🔐 Authenticated | Remove (`remove`) |

### Audit Logs
* **File:** `StaffCRM/AuditLog/AuditLog.routes.js`
* **Prefix:** `/api/v1.0/audit-logs`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1.0/audit-logs` | 🔐 Authenticated<br/>`admin, hr` | Get audit logs (`getAuditLogs`) |
| **`GET`** | `/api/v1.0/audit-logs/entity/:module/:entityId` | 🔐 Authenticated | Get entity history (`getEntityHistory`) |
| **`DELETE`** | `/api/v1.0/audit-logs/purge` | 🔐 Authenticated | Delete old logs (`deleteOldLogs`) |

### Notifications
* **File:** `StaffCRM/Notifications/notification.routes.js`
* **Prefix:** `/api/v1.0/notifications`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1.0/notifications/subscribe` | 🔐 Authenticated | Subscribe (`subscribe`) |
| **`POST`** | `/api/v1.0/notifications/test` | 🔐 Authenticated | Test notification (`testNotification`) |
| **`POST`** | `/api/v1.0/notifications/trigger-reminders` | 🔐 Authenticated | Trigger reminders (`triggerReminders`) |

### Tickets & Helpdesk
* **File:** `StaffCRM/Tickets/ticket.routes.js`
* **Prefix:** `/api/v1.0/tickets`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1.0/tickets` | 🔐 Authenticated | Create ticket (`createTicket`) |
| **`GET`** | `/api/v1.0/tickets/my` | 🔐 Authenticated | Get my tickets (`getMyTickets`) |
| **`GET`** | `/api/v1.0/tickets` | 🔐 Authenticated<br/>`admin, hr` | Get all tickets (`getAllTickets`) |
| **`PUT`** | `/api/v1.0/tickets/:id/status` | 🔐 Authenticated<br/>`admin, hr` | Update ticket status (`updateTicketStatus`) |

### Payroll Management
* **File:** `StaffCRM/Payroll/payroll.routes.js`
* **Prefix:** `/api/v1.0/payroll`

| Method | Endpoint | Auth / Permission | Description / Handler |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1.0/payroll/my` | 🔐 Authenticated | Employee routes |
| **`POST`** | `/api/v1.0/payroll/generate` | 🔐 Authenticated<br/>`admin, hr` | Generate draft payrolls (`generateDraftPayrolls`) |
| **`GET`** | `/api/v1.0/payroll` | 🔐 Authenticated<br/>`admin, hr` | Get payrolls by month (`getPayrollsByMonth`) |
| **`PUT`** | `/api/v1.0/payroll/:id/pay` | 🔐 Authenticated<br/>`admin, hr` | Mark payroll as paid (`markPayrollAsPaid`) |
| **`POST`** | `/api/v1.0/payroll/:id/send` | 🔐 Authenticated<br/>`admin, hr` | Send payslip (`sendPayslip`) |


---

*Total Registered Backend Routes Documented:* **146 endpoints**
