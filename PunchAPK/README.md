# VDS PunchAPK — Android Biometric Attendance Kiosk

VDS PunchAPK is a dedicated, production-grade Android attendance kiosk application engineered for **Vidya Digital Studio**. Built with **React Native**, **TypeScript**, and **Expo SDK 52**, it runs on a dedicated **Samsung Galaxy M32** terminal to provide seamless, biometric-verified employee attendance while integrating directly with the master VDS CRM backend.

---

## 1. System Architecture & Flow

```
┌─────────────────────────────────┐        ┌──────────────────────────────────┐
│   Samsung Galaxy M32 Kiosk      │        │       VDS Master Backend         │
│  (React Native / Expo SDK 52)   │        │     (Node.js / Express 5.1)      │
├─────────────────────────────────┤        ├──────────────────────────────────┤
│ 1. Header & Live IST Clock      │        │ • /api/v1.0/kiosk/employees      │
│ 2. Searchable Employee Grid     │───────>│   (Sanitized active directory)   │
│ 3. Confirmation Action Modal    │        │                                  │
│ 4. Native BiometricPrompt       │        │ • /api/v1.0/kiosk/punch-in & out │
│    (Side power key sensor)      │───────>│   (Idempotency & 10:30 AM rule)  │
│ 5. Full-Screen Green Result     │<───────│ • Master Attendance & AuditLog   │
└─────────────────────────────────┘        └──────────────────────────────────┘
```

1. **Active Directory:** Fetches sanitized employee profiles (name, role, designation, avatar, live status) from the master backend.
2. **Action Derivation:** Automatically derives the correct action (`PUNCH_IN` vs `PUNCH_OUT` vs `PUNCH_IN AGAIN`) based on today's active work record.
3. **Hardware Biometric Prompt:** Prompts the employee to touch the Samsung Galaxy M32's capacitive side power button sensor (`expo-local-authentication`).
4. **Server Confirmation:** Sends a cryptographically signed kiosk request with a client UUIDv4 idempotency key. The backend applies core attendance rules (holiday check, 10:30 AM half-day cutoff, multi-session punches) and returns server-authoritative timestamps.
5. **Instant Synchronization:** Attendance state updates simultaneously in MongoDB Atlas and reflects in real time across the existing VIDYACRM web dashboard.

---

## 2. Project Directory Structure

```
PunchAPK/
├── .github/
│   └── workflows/
│       └── build-apk.yml               # Standalone GitHub Actions APK build workflow
├── docs/
│   ├── KIOSK_API.md                    # Detailed API contract specifications
│   └── M32_DEVICE_TESTING.md           # Samsung Galaxy M32 hardware QA checklist
├── src/
│   ├── api/
│   │   ├── client.ts                   # Axios client with device auth headers & timeout
│   │   └── kiosk.api.ts                # Directory and punch endpoint methods
│   ├── components/
│   │   ├── ConfirmationModal.tsx       # Employee action modal & biometric instruction
│   │   ├── EmployeeCard.tsx            # Avatar, name, role & status badge card
│   │   ├── ErrorOverlay.tsx            # Red rejection/error modal
│   │   ├── Header.tsx                  # Live IST clock, branding & status dot
│   │   ├── StatusBadge.tsx             # Color-coded attendance status pills
│   │   └── SuccessOverlay.tsx          # Green server confirmation & 5s auto-reset
│   ├── config/
│   │   └── env.ts                      # Configuration keys and fallback constants
│   ├── hooks/
│   │   └── useIdleReset.ts             # 30-second user inactivity watchdog
│   ├── navigation/
│   │   └── RootNavigator.tsx           # Native stack navigator (Home & Setup screens)
│   ├── screens/
│   │   ├── KioskHomeScreen.tsx         # Primary kiosk interface
│   │   └── KioskSetupScreen.tsx        # Admin device pairing & hardware diagnostics
│   ├── services/
│   │   ├── biometric.service.ts        # Android BiometricPrompt wrapper
│   │   └── storage.service.ts          # expo-secure-store credentials management
│   └── types/
│       └── index.ts                    # TypeScript models and response definitions
├── tests/
│   └── kioskApp.test.js                # Client logic and filter unit tests
├── .env.example                        # Local environment template
├── .gitignore                          # Git exclusions (build artifacts, keys, env)
├── app.json                            # Expo manifest, biometric permissions & package ID
├── babel.config.js                     # Babel configuration
├── index.ts                            # Expo application entry point
├── package.json                        # Manifest, dependencies and build scripts
├── PUNCHAPK_TECHNICAL_AUDIT.md         # Original feasibility audit report
├── README.md                           # This documentation
└── tsconfig.json                       # TypeScript compiler options
```

---

## 3. GitHub Actions Automated APK Build Pipeline

The project includes an automated GitHub Actions CI workflow located at:
- Repository root: [`.github/workflows/build-punchapk.yml`](file:///d:/_VDS/VDS%20Softwares/.github/workflows/build-punchapk.yml)
- Project folder: [`PunchAPK/.github/workflows/build-apk.yml`](file:///d:/_VDS/VDS%20Softwares/PunchAPK/.github/workflows/build-apk.yml)

### Workflow Highlights
- **Trigger:** Triggers automatically on any push impacting `PunchAPK/**` or via manual **Run workflow** (`workflow_dispatch`).
- **Cloud Runner:** Runs on `ubuntu-latest` with **Node.js 20**, **Java JDK 17**, and Android SDK tools.
- **Automated Testing:** Runs backend integration tests and client unit tests prior to compilation.
- **Expo Prebuild & Gradle:** Executes `npx expo prebuild --platform android --clean` and compiles via `./gradlew assembleRelease` (or `assembleDebug`).
- **Artifact Upload:** Automatically uploads the resulting `.apk` to the GitHub Actions run artifacts with 30-day retention.

### Downloading the Generated APK
1. Navigate to the repository on GitHub.
2. Click the **Actions** tab.
3. Select the latest run of **Build VDS PunchAPK Android**.
4. Scroll to the **Artifacts** section at the bottom of the page.
5. Click **vds-punchapk-release-*.apk** (or debug APK) to download and transfer to the Samsung Galaxy M32.

### Optional GitHub Repository Secrets
To build signed production release APKs, configure these secrets under **Settings** → **Secrets and variables** → **Actions**:
- `EXPO_PUBLIC_API_URL`: The production API base URL (e.g., `http://backend.vidyadigitalstudio.com/api/v1.0`).
- `ANDROID_KEYSTORE_BASE64`: Base64-encoded Java Keystore file.
- `ANDROID_KEYSTORE_PASSWORD`: Master Keystore password.
- `ANDROID_KEY_ALIAS`: Signing key alias.
- `ANDROID_KEY_PASSWORD`: Signing key password.
*(If secrets are omitted, the workflow automatically compiles a functional unsigned/debug APK ready for sideloading).*

---

## 4. Local Development & Testing

### Running Tests
From the root or project directory:
```bash
# Run client unit tests
cd PunchAPK
npm test

# Run backend kiosk integration tests
cd ../Backend
npm test
```

### Starting the Expo Development Server
```bash
cd PunchAPK
npm install
npx expo start
```

---

## 5. Security & Device Administration

### Kiosk Authentication
Requests require `X-Kiosk-Device-Id` and `X-Kiosk-Device-Key` headers. The terminal key is stored securely in the phone's Android KeyStore via `expo-secure-store`.

### Server Authority
Under no circumstances does the client dictate attendance times. The backend derives the timestamp via `nowUTC()` upon validating the request.

### Inactivity Watchdog
If an employee taps their name and walks away, an inactivity timer automatically cancels the session and resets the screen to the clean directory after 30 seconds.

### Biometric Identity Limitation
Android's `BiometricPrompt` performs **1:1 local authentication**, verifying that a finger enrolled in phone settings matched. It does not perform 1:N facial/fingerprint identity matching. As such, the kiosk operates as an **attended/supervised terminal**. See [M32_DEVICE_TESTING.md](docs/M32_DEVICE_TESTING.md) for complete details.

