# MyStaff Android APK (VIDYACRM Mobile)

Official standalone Android application wrapper for **Vidya Digital Studio Staff CRM** (`VIDYACRM`).

---

## App Specifications

| Parameter | Value |
|---|---|
| **App Name** | **MyStaff** |
| **Output Artifact** | **`MyStaff.apk`** |
| **Android Package Name** | **`mystaff.vidyadigitalstudio.com`** |
| **Version** | **`1.3.90`** (Version Code: `1390`) |
| **Target Architecture** | ARM64 / ARMv7 / x86_64 Android 8.0+ (API 26+) |
| **Primary Theme Color** | `#0f5c44` (Deep Forest Green) |
| **Default Target URL** | `https://backend.vidyadigitalstudio.com` (configurable via `EXPO_PUBLIC_CRM_URL`) |

---

## Features

- **Hardware Back Button Navigation**: Intercepts Android back gestures to navigate browser history instead of abruptly exiting the app. Double-tap to exit on root screen.
- **Pull-To-Refresh**: Swipe down from top to reload the active view.
- **Camera & File Uploads**: Allows photo capture and file browsing for attendance verification, leave documents, receipts, and invoice attachments.
- **Cleartext Traffic Support**: Configured with `usesCleartextTraffic: true` to seamlessly connect with local studio network servers and HTTP backends.
- **Offline / Server Unreachable Protection**: Displays a branded retry card when network connection is interrupted.
- **Edge-to-Edge Status Bar**: Forest green `#0f5c44` status bar with light icons matching CRM navigation.

---

## Automated GitHub Workflow (`build-vidyacrm-apk.yml`)

The APK is built automatically using GitHub Actions in `.github/workflows/build-vidyacrm-apk.yml`.

### How to Trigger the Build

1. **Automatic Build on Git Push**:
   - Pushing any changes to `VidyaCrmApk/**`, `VIDYACRM/**`, or `.github/workflows/build-vidyacrm-apk.yml` on branch `main` automatically starts the build.

2. **Manual Dispatch (One-Click)**:
   - Go to your GitHub Repository: `https://github.com/dhruv-itwala/Vidya-Digital-Studio-new`
   - Click on the **Actions** tab.
   - Select **Build MyStaff VIDYACRM Android APK** from the left sidebar.
   - Click **Run workflow** -> Select `release` (or `debug`) -> Click **Run workflow**.

3. **Downloading the APK**:
   - Once the workflow run completes (typically ~3-4 minutes), scroll down to the **Artifacts** section at the bottom of the summary page.
   - Download **`MyStaff.apk`** directly to your computer or Android phone.

---

## Folder Structure

```
VidyaCrmApk/
├── assets/
│   ├── adaptive-icon.png      # Android Adaptive Launcher Icon
│   ├── icon.png               # High-res App Icon (512x512)
│   ├── splash.png             # Splash screen
│   ├── logo.png               # Brand logo
│   └── Green_Logo.png         # Green variant logo
├── src/                       # Additional native utilities
├── tests/
│   └── app.test.js            # Configuration & asset integrity tests
├── .env.example               # Environment variable templates
├── .gitignore                 # Android/node_modules ignore rules
├── app.json                   # Expo & Android native configuration
├── App.tsx                    # Native WebView container & back button logic
├── babel.config.cjs           # Babel compiler setup
├── index.ts                   # Native entry point
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript compilation rules
```

---

## Local Development (Optional)

To run or test locally on an Android device or emulator:

```bash
# 1. Install dependencies
cd VidyaCrmApk
npm install

# 2. Run unit tests
npm test

# 3. Start Expo development server
npm start
```

