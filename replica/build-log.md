# Replica Build Log: MyStaff Native Android (Kotlin)

- **Target App:** `MyStaff` (Package: `mystaff.vidyadigitalstudio.com`)
- **Backend Base:** `https://backend.vidyadigitalstudio.com/api/v1.0`
- **Methodology:** Clean-room implementation using `replica-recon`, `replica-architect`, `replica-design`, and `replica-build`.

## Completed Stages

1. **Recon Map & Features (`replica/recon.md`, `replica/features.csv`)**:
   - Analyzed `VIDYACRM` web app screens (S01 Login, S02 Dashboard, S03 Attendance, S04 Tasks, S05 Todo, S06 Leaves, S07 Clients, S08 Leads, S09 Invoices, S10 Holidays, S11 Profile).
   - Documented core flows (F01-F05) and entity data structures.

2. **Architecture Specification (`replica/architecture.md`)**:
   - Modern Native Android Kotlin stack with AGP 8.4+, Jetpack Compose, Material 3, Retrofit 2, OkHttp 4, EncryptedSharedPreferences (Android Keystore), and Coroutines/StateFlow.

3. **Design Tokens (`replica/design/tokens.md`)**:
   - Brand Emerald (`#0f5c44`, `#1b8764`), background (`#f9fafb`), surfaces, typography, and status badges.

4. **Native Android Implementation (`VidyaCrmApk/`)**:
   - Root project files: `settings.gradle.kts`, `build.gradle.kts`, `gradle.properties`, `gradlew`, `gradlew.bat`.
   - App module: `app/build.gradle.kts` with Compose, Retrofit, Security-Crypto, Coil, JUnit.
   - Android Manifest: `app/src/main/AndroidManifest.xml` with native permissions (`INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE`, `CAMERA`), `MyStaffApplication`, `MainActivity`.
   - Resources: `strings.xml`, `colors.xml`, `themes.xml`, `network_security_config.xml`, drawables (`ic_launcher.png`, `green_logo.png`, `app_logo.png`).
   - Clean MVVM source code in `mystaff.vidyadigitalstudio.com`:
     - Models: `AuthModels.kt`, `AttendanceModels.kt`, `TaskModels.kt`, `LeaveModels.kt`, `CrmModels.kt`.
     - Security: `TokenManager.kt` using `EncryptedSharedPreferences`.
     - Networking: `ApiClient.kt`, `AuthInterceptor.kt`, `MyStaffApiService.kt`.
     - Repositories: `AuthRepository.kt`, `AttendanceRepository.kt`, `TaskRepository.kt`, `CrmRepository.kt`.
     - ViewModels: `AuthViewModel.kt`, `DashboardViewModel.kt`, `AttendanceViewModel.kt`, `TaskViewModel.kt`, `CrmViewModel.kt`.
     - Compose UI: `Theme.kt`, `Color.kt`, `Type.kt`, `AppTopBar.kt`, `AppBottomBar.kt`, `StatCard.kt`, `StatusBadge.kt`, `NavGraph.kt`.
     - Screens: `LoginScreen.kt`, `DashboardScreen.kt`, `AttendanceScreen.kt`, `TasksScreen.kt`, `LeavesScreen.kt`, `CrmHubScreen.kt`, `ProfileScreen.kt`.

5. **CI/CD Workflow (`.github/workflows/build-vidyacrm-apk.yml`)**:
   - Upgraded to build pure native Android Kotlin APK using `./gradlew assembleRelease` / `./gradlew assembleDebug` and upload `MyStaff.apk`.

