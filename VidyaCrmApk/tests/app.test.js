import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

describe("MyStaff Native Android Kotlin Verification", () => {
  test("1.1 Root Gradle project files exist and define MyStaff project", () => {
    const settingsPath = path.join(rootDir, "settings.gradle.kts");
    const buildPath = path.join(rootDir, "build.gradle.kts");
    const gradlePropsPath = path.join(rootDir, "gradle.properties");

    assert.ok(fs.existsSync(settingsPath), "settings.gradle.kts must exist");
    assert.ok(fs.existsSync(buildPath), "build.gradle.kts must exist");
    assert.ok(fs.existsSync(gradlePropsPath), "gradle.properties must exist");

    const settingsContent = fs.readFileSync(settingsPath, "utf8");
    assert.ok(settingsContent.includes('rootProject.name = "MyStaff"'), "Project name must be MyStaff");
    assert.ok(settingsContent.includes('include(":app")'), "Must include :app module");
  });

  test("1.2 App module build.gradle.kts configures Kotlin, Compose, and mystaff package", () => {
    const appBuildPath = path.join(rootDir, "app", "build.gradle.kts");
    assert.ok(fs.existsSync(appBuildPath), "app/build.gradle.kts must exist");

    const appBuildContent = fs.readFileSync(appBuildPath, "utf8");
    assert.ok(
      appBuildContent.includes('applicationId = "mystaff.vidyadigitalstudio.com"'),
      "Package name must be mystaff.vidyadigitalstudio.com",
    );
    assert.ok(appBuildContent.includes("compose = true"), "Jetpack Compose must be enabled");
    assert.ok(appBuildContent.includes("com.squareup.retrofit2"), "Retrofit must be included");
    assert.ok(appBuildContent.includes("androidx.security:security-crypto"), "EncryptedSharedPreferences must be included");
    assert.ok(
      appBuildContent.includes("https://backend.vidyadigitalstudio.com/api/v1.0/"),
      "Base API URL must point to backend.vidyadigitalstudio.com",
    );
  });

  test("1.3 AndroidManifest.xml configures MyStaffApplication and required native permissions", () => {
    const manifestPath = path.join(rootDir, "app", "src", "main", "AndroidManifest.xml");
    assert.ok(fs.existsSync(manifestPath), "AndroidManifest.xml must exist");

    const manifestContent = fs.readFileSync(manifestPath, "utf8");
    assert.ok(manifestContent.includes("android.permission.INTERNET"), "Must require INTERNET");
    assert.ok(manifestContent.includes("android.permission.ACCESS_NETWORK_STATE"), "Must require ACCESS_NETWORK_STATE");
    assert.ok(manifestContent.includes("android.permission.ACCESS_WIFI_STATE"), "Must require ACCESS_WIFI_STATE");
    assert.ok(manifestContent.includes('android:name=".MyStaffApplication"'), "Application class must be MyStaffApplication");
    assert.ok(manifestContent.includes('android:name=".MainActivity"'), "MainActivity must be declared");
  });

  test("1.4 Kotlin MVVM architecture files are all present", () => {
    const kotlinRoot = path.join(rootDir, "app", "src", "main", "java", "mystaff", "vidyadigitalstudio", "com");

    const requiredFiles = [
      "MyStaffApplication.kt",
      "MainActivity.kt",
      "data/local/TokenManager.kt",
      "data/api/AuthInterceptor.kt",
      "data/api/ApiClient.kt",
      "data/api/MyStaffApiService.kt",
      "data/models/AuthModels.kt",
      "data/models/AttendanceModels.kt",
      "data/models/TaskModels.kt",
      "data/models/LeaveModels.kt",
      "data/models/CrmModels.kt",
      "data/repository/AuthRepository.kt",
      "data/repository/AttendanceRepository.kt",
      "data/repository/TaskRepository.kt",
      "data/repository/CrmRepository.kt",
      "ui/theme/Color.kt",
      "ui/theme/Type.kt",
      "ui/theme/Theme.kt",
      "ui/navigation/Screen.kt",
      "ui/navigation/NavGraph.kt",
      "ui/components/AppTopBar.kt",
      "ui/components/AppBottomBar.kt",
      "ui/components/StatCard.kt",
      "ui/components/StatusBadge.kt",
      "ui/screens/auth/LoginScreen.kt",
      "ui/screens/dashboard/DashboardScreen.kt",
      "ui/screens/attendance/AttendanceScreen.kt",
      "ui/screens/tasks/TasksScreen.kt",
      "ui/screens/leaves/LeavesScreen.kt",
      "ui/screens/crm/CrmHubScreen.kt",
      "ui/screens/profile/ProfileScreen.kt",
      "viewmodel/AuthViewModel.kt",
      "viewmodel/DashboardViewModel.kt",
      "viewmodel/AttendanceViewModel.kt",
      "viewmodel/TaskViewModel.kt",
      "viewmodel/CrmViewModel.kt",
    ];

    for (const relFile of requiredFiles) {
      const fullPath = path.join(kotlinRoot, relFile);
      assert.ok(fs.existsSync(fullPath), `Missing required Kotlin file: ${relFile}`);
    }
  });

  test("1.5 Brand drawables and XML resources are configured", () => {
    const resDir = path.join(rootDir, "app", "src", "main", "res");
    assert.ok(fs.existsSync(path.join(resDir, "values", "strings.xml")), "strings.xml must exist");
    assert.ok(fs.existsSync(path.join(resDir, "values", "colors.xml")), "colors.xml must exist");
    assert.ok(fs.existsSync(path.join(resDir, "values", "themes.xml")), "themes.xml must exist");
    assert.ok(fs.existsSync(path.join(resDir, "drawable", "ic_launcher.png")), "ic_launcher.png must exist");
    assert.ok(fs.existsSync(path.join(resDir, "drawable", "green_logo.png")), "green_logo.png must exist");
  });

  test("1.6 Kotlin Unit tests exist for models and business logic", () => {
    const unitTestPath = path.join(rootDir, "app", "src", "test", "java", "mystaff", "vidyadigitalstudio", "com", "MyStaffUnitTest.kt");
    assert.ok(fs.existsSync(unitTestPath), "MyStaffUnitTest.kt must exist");
  });
});
