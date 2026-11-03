# MyStaff — Native Android Kotlin Application

Official native Android application for **Vidya Digital Studio** management, attendance, tasks, clients, and CRM operations.

## Architecture & Tech Stack

- **Target Platform:** Android Native (API 24 to 34+)
- **Application ID:** `mystaff.vidyadigitalstudio.com`
- **Language:** Kotlin 1.9.24+
- **UI Framework:** Jetpack Compose + Material 3 Design
- **Architecture:** Clean MVVM with Unidirectional Data Flow (UDF)
- **Networking:** Retrofit 2.11 + OkHttp 4.12
- **Backend API:** `https://backend.vidyadigitalstudio.com/api/v1.0/`
- **Security & Storage:** Android Keystore + EncryptedSharedPreferences (AES-256-GCM)
- **Image Loading:** Coil Compose
- **Build System:** Gradle (AGP 8.4+)

## Key Features

1. **Staff Authentication:** Secure login using employee email/phone and password with JWT token persistence.
2. **Attendance Management:** Live studio Wi-Fi verification, one-tap Punch In / Punch Out, Break tracking, and attendance logs.
3. **Tasks & To-Do:** Tabbed task view (Pending, In Progress, Completed), real-time priority badges, and personal to-do checklist.
4. **Leaves & Absences:** Live leave balances (Casual, Sick, Paid), leave application form with date range picker, and approval history.
5. **CRM Directory:** Fast searchable directory of Clients, Leads pipeline, Studio Invoices with balance indicators, and declared studio holidays.
6. **Profile:** Employee identity, designation, department, and session management.

## Building the APK

### Build with GitHub Actions
Pushing to the `main` branch or triggering `.github/workflows/build-vidyacrm-apk.yml` via `workflow_dispatch` will automatically compile and release `MyStaff.apk`.

### Local Build
```bash
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release-unsigned.apk
```
