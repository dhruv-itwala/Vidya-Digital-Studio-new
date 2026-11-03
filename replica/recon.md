# Replica Recon Map: VIDYACRM -> MyStaff Native Android (Kotlin)

## 1. Project Scope & Target
- **Source Application:** VIDYACRM Web Application (`d:\_VDS\VDS Softwares\VIDYACRM`)
- **Backend API:** Vidya Digital Studio API at `https://backend.vidyadigitalstudio.com/api/v1.0`
- **Target Platform:** Native Android (Kotlin + Jetpack Compose)
- **App Name:** `MyStaff`
- **Application ID / Package:** `mystaff.vidyadigitalstudio.com`
- **Primary Audience:** Employees, HR, and Admin staff of Vidya Digital Studio.

---

## 2. Screen Inventory

| ID | Screen Name | Route / Path in Web | Primary Purpose | Key Components & Widgets | States Handled |
|:---|:---|:---|:---|:---|:---|
| **S01** | Login Screen | `/login` | Staff authentication with email/phone & password | Branding header, Input fields, Password visibility toggle, Remember session, Login CTA, Error alert | Empty, Invalid Credentials, Loading, Authenticated |
| **S02** | Dashboard Screen | `/dashboard` | Daily high-level overview & quick actions | Attendance punch badge, Work summary cards, Task progress, Quick action chips, Notice carousel | Loading, Active session, On break, Clocked out |
| **S03** | Attendance & Punch | `/attendance` | Office check-in/out, breaks, and daily work log | Today's punch timer, Office Wi-Fi status indicator, Punch In/Out CTA, Break In/Out CTA, Monthly calendar log | Not clocked in, Clocked in, On Break, Completed day, Wi-Fi verified |
| **S04** | Tasks Management | `/tasks` | Daily assigned task workflow and tracking | Task status tabs (Pending, In Progress, Completed), Task card with priority, Task completion form | Empty list, Loading, Filtered, Submitting update |
| **S05** | To-Do List | `/todo` | Personal employee checklist | Checklist items, Add task sheet, Toggle complete, Delete item | Empty, Active items, Completed items |
| **S06** | Leaves & Approvals | `/leave` | Leave balance, application form, and HR approvals | Leave balance chips (Sick, Casual, Paid), Apply Leave modal/form, Leave history cards, Admin approve/reject controls | Empty, Pending review, Approved, Rejected |
| **S07** | Clients CRM | `/clients` | Client directory, projects, and contact info | Client search bar, Client cards with phone/email shortcuts, Detail view with billing & assets | Loading, Empty search results, Populated list |
| **S08** | Leads CRM | `/leads` | Sales pipeline and inquiries management | Pipeline stage selector (New, Contacted, Proposal, Converted, Lost), Add Lead floating button, Lead card | Empty stage, Filtered, Lead details |
| **S09** | Invoices & Billing | `/invoices` | Studio billing status and client invoices | Invoice summary metrics, Invoice item list with status pill (Paid, Partial, Pending), View details | Loading, Populated, Status filter |
| **S10** | Studio Holidays | `/holidays` | Company calendar and declared studio holidays | Upcoming holiday countdown, Month-by-month holiday cards | Empty, Upcoming list |
| **S11** | Profile & Settings | `/profile` | Employee identity, emergency contact, notification preferences, logout | Profile avatar, Personal details, App version watermark, Logout CTA with confirmation | View mode, Logging out |

---

## 3. Core User Flows

### F01: Employee Login & Session Bootstrapping
`S01 (Login) -> API POST /users/login -> Store JWT in EncryptedSharedPreferences -> Fetch User Profile /users/me -> Navigate to S02 (Dashboard)`
- *Edge Cases:* Invalid credentials, offline network, expired token triggers auto-logout.

### F02: Office Attendance & Punch Action
`S02 (Dashboard) or S03 (Attendance) -> Verify Studio Wi-Fi / IP (/attendance/wifi-check) -> Tap "Punch In" (/attendance/punch-in) -> Timer starts -> Tap "Break In/Out" -> Tap "Punch Out"`
- *Edge Cases:* Employee not on studio Wi-Fi, late arrival past 10:30 AM IST (marks HALF_DAY), multiple punches.

### F03: Task Tracking & Status Updates
`S04 (Tasks) -> View assigned tasks -> Select Task -> Update status to "In Progress" or "Completed" (/tasks/:id) -> Refresh list`

### F04: Leave Application & Balance Check
`S06 (Leaves) -> Check balance (/leave/balance) -> Tap "Apply Leave" -> Fill type, dates, reason -> Submit (/leave/apply) -> Appears in pending leaves`

### F05: Quick Client / Lead Communication
`S07 (Clients) or S08 (Leads) -> Search client name -> Tap phone / WhatsApp icon to initiate native intent`

---

## 4. Inferred Entity Models

- **User / Employee:** `id`, `name`, `email`, `phone`, `role` (`admin`, `hr`, `employee`), `department`, `designation`, `avatar`, `joinDate`
- **Attendance Record:** `id`, `userId`, `date`, `punchIn`, `punchOut`, `breaks` (list of in/out timestamps), `workMinutes`, `status` (`PRESENT`, `HALF_DAY`, `LATE`, `ABSENT`), `wifiVerified`
- **Task:** `id`, `title`, `description`, `assignedTo`, `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), `status` (`PENDING`, `IN_PROGRESS`, `COMPLETED`), `dueDate`
- **Leave:** `id`, `userId`, `leaveType` (`CASUAL`, `SICK`, `PAID`, `UNPAID`), `startDate`, `endDate`, `reason`, `status` (`PENDING`, `APPROVED`, `DECLINED`)
- **Client:** `id`, `name`, `companyName`, `email`, `phone`, `address`, `gstNumber`, `status`
- **Lead:** `id`, `clientName`, `phone`, `service`, `source`, `status` (`NEW`, `CONTACTED`, `PROPOSAL`, `WON`, `LOST`), `budget`
- **Invoice:** `id`, `invoiceNumber`, `clientName`, `totalAmount`, `paidAmount`, `balanceAmount`, `dueDate`, `status` (`PAID`, `PARTIAL`, `PENDING`)

