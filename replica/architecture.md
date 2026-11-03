# Architecture Specification: MyStaff Android Native (Kotlin)

## 1. Stack & Technology Choices

| Component | Choice | Rationale |
|:---|:---|:---|
| **Language** | Kotlin 1.9.24+ | Native Android standard, null-safety, coroutines first-class citizen. |
| **UI Toolkit** | Jetpack Compose + Material 3 | Declarative UI, reactive state binding, fluid modern animations. |
| **Design Tokens** | Brand Emerald (`#0f5c44`, `#1b8764`) | Matches Vidya Digital Studio brand identity exactly. |
| **Architecture Pattern** | MVVM / MVI with Unidirectional Data Flow | Clean separation of UI, State, ViewModel, Repository, and API Layer. |
| **Networking** | Retrofit 2 + OkHttp 4 + Gson Converter | Industry standard, robust interceptors for JWT injection and error logging. |
| **Security & Storage** | EncryptedSharedPreferences (AndroidX Security) | Hardware-backed keystore encryption for JWT tokens and employee credentials. |
| **Concurrency** | Kotlin Coroutines + StateFlow | Structured concurrency, lifecycle-aware UI state rendering. |
| **Navigation** | Navigation Compose | Type-safe declarative single-activity multi-screen routing. |
| **Build System** | Gradle with Android Gradle Plugin (AGP) 8.4+ | Automated GitHub Actions CI pipeline producing standalone release/debug APKs. |

---

## 2. Package Architecture (`mystaff.vidyadigitalstudio.com`)

```text
mystaff.vidyadigitalstudio.com/
├── MyStaffApplication.kt             # Application class initializing security & networking
├── MainActivity.kt                   # Single Activity hosting Navigation Compose
├── data/
│   ├── api/
│   │   ├── ApiClient.kt             # Retrofit builder & OkHttp configuration
│   │   ├── AuthInterceptor.kt       # Injects "Authorization: Bearer <TOKEN>" dynamically
│   │   └── MyStaffApiService.kt     # Retrofit interface with endpoints from Backend/AllRoutes.md
│   ├── local/
│   │   └── TokenManager.kt          # Encrypted storage for JWT token & user session
│   ├── models/
│   │   ├── AuthModels.kt            # LoginRequest, LoginResponse, UserDto
│   │   ├── AttendanceModels.kt      # PunchRequest, TodayRecordResponse, WorkRecordDto
│   │   ├── TaskModels.kt            # TaskDto, UpdateTaskStatusRequest
│   │   ├── LeaveModels.kt           # LeaveDto, ApplyLeaveRequest, LeaveBalanceDto
│   │   ├── CrmModels.kt             # ClientDto, LeadDto, InvoiceDto, HolidayDto
│   │   └── CommonModels.kt          # ApiResponse<T>, ErrorResponse
│   └── repository/
│       ├── AuthRepository.kt        # Login, logout, fetch user profile
│       ├── AttendanceRepository.kt  # Punch in/out, check Wi-Fi, fetch history
│       ├── TaskRepository.kt        # Fetch assigned tasks, update progress
│       ├── LeaveRepository.kt       # Apply leave, fetch balance, get approvals
│       └── CrmRepository.kt         # Clients, leads, invoices, holidays
├── ui/
│   ├── theme/
│   │   ├── Color.kt                 # Brand emeralds (#0f5c44, #1b8764, #ecfdf5)
│   │   ├── Type.kt                  # Typography scale
│   │   └── Theme.kt                 # Material 3 Theme setup with light/dark support
│   ├── navigation/
│   │   ├── Screen.kt                # Sealed class with screen route identifiers
│   │   └── NavGraph.kt              # NavHost binding all routes and ViewModels
│   ├── components/
│   │   ├── AppTopBar.kt             # Unified app header with title & profile actions
│   │   ├── AppBottomBar.kt          # Bottom navigation bar (Home, Attendance, Tasks, CRM, Profile)
│   │   ├── StatCard.kt              # Metric summary widgets
│   │   └── StatusBadge.kt           # Color-coded pill badges for statuses
│   └── screens/
│       ├── auth/LoginScreen.kt      # Authentication screen
│       ├── dashboard/DashboardScreen.kt # High-level summary & punch shortcut
│       ├── attendance/AttendanceScreen.kt # Work timer, punch in/out, break controls
│       ├── tasks/TasksScreen.kt     # Tabbed task list & status change sheet
│       ├── leaves/LeavesScreen.kt   # Leave balances & application form
│       ├── crm/CrmHubScreen.kt      # Clients, Leads & Invoices directory
│       └── profile/ProfileScreen.kt # User identity & app settings
└── viewmodel/
    ├── AuthViewModel.kt
    ├── DashboardViewModel.kt
    ├── AttendanceViewModel.kt
    ├── TaskViewModel.kt
    └── CrmViewModel.kt
```

---

## 3. API Contract Mapping

All routes point to `https://backend.vidyadigitalstudio.com/api/v1.0`:

- `POST /users/login` → `authService.login(request)`
- `GET /users/me` → `authService.getProfile()`
- `GET /attendance/work-record/today` → `attendanceService.getTodayRecord()`
- `GET /attendance/wifi-check` → `attendanceService.checkWifi()`
- `POST /attendance/punch-in` → `attendanceService.punchIn()`
- `POST /attendance/punch-out` → `attendanceService.punchOut()`
- `POST /attendance/break-in` → `attendanceService.breakIn()`
- `POST /attendance/break-out` → `attendanceService.breakOut()`
- `GET /attendance/my` → `attendanceService.getMyAttendance()`
- `GET /tasks/my` (or `/tasks`) → `taskService.getMyTasks()`
- `PATCH /tasks/:id` → `taskService.updateStatus(id, body)`
- `GET /leave/balance` → `leaveService.getBalance()`
- `GET /leave/my` → `leaveService.getMyLeaves()`
- `POST /leave/apply` → `leaveService.applyLeave(body)`
- `GET /clients` → `crmService.getClients()`
- `GET /leads` → `crmService.getLeads()`
- `GET /invoice` → `crmService.getInvoices()`
- `GET /holiday/employee` → `crmService.getHolidays()`

