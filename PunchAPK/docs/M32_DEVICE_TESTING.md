# Samsung Galaxy M32 Hardware QA Checklist & Kiosk Setup Guide

This guide provides physical device testing procedures, hardware configuration, and kiosk lock instructions for running **VDS PunchAPK** on a Samsung Galaxy M32.

---

## 1. Hardware Specifications & Sensor Location

- **Model:** Samsung Galaxy M32 (SM-M325F / SM-M326B)
- **OS:** Android 11 / Android 12 / Android 13 (One UI 5.0)
- **Fingerprint Scanner:** Capacitive sensor embedded flush into the side power key on the right edge of the phone.
- **Biometric Security Level:** Android Class 3 (Strong).

---

## 2. Samsung Galaxy M32 Android Configuration

### 2.1 Enrolling Biometrics
1. Open phone **Settings** → **Biometrics and security** → **Fingerprints**.
2. Set a strong device passcode known **only to the Studio Administrator**.
3. Register the appropriate employee or supervisor fingerprints on the sensor.
4. Ensure **Fingerprint unlock** is toggled **ON**.

### 2.2 Enabling App Pinning (Kiosk Lock Task Mode)
To prevent employees from exiting the attendance app to the home screen:
1. Open phone **Settings** → **Security and privacy** → **More security settings** → **Pin app** (Screen pinning).
2. Toggle **Pin app** to **ON**.
3. Toggle **"Ask for PIN before unpinning"** to **ON**.
4. Launch **VDS PunchAPK**.
5. Swipe up into recent apps, tap the VDS app icon at the top of the card, and select **"Pin this app"**.
6. The application is now locked in full-screen kiosk mode. Exiting requires holding the Back and Recents buttons simultaneously and entering the Admin PIN.

---

## 3. Physical Device Testing Checklist

| Test Case | Scenario | Expected Physical Behavior | Result |
| :---: | :--- | :--- | :---: |
| **TC-01** | **App Startup** | App boots immediately into Kiosk Home with live ticking IST clock and "KIOSK READY" status badge. | ⬜ |
| **TC-02** | **Directory Search** | Typing in the search bar dynamically filters employees by name and designation within 100ms. | ⬜ |
| **TC-03** | **Card Selection** | Tapping an employee card pops up the Confirmation Modal with employee name, role, and appropriate action button. | ⬜ |
| **TC-04** | **Sensor Trigger** | Tapping "Confirm Punch In/Out" immediately triggers Android’s native bottom-sheet BiometricPrompt. | ⬜ |
| **TC-05** | **Enrolled Fingerprint** | Touching the side power key with a registered finger unlocks the prompt and dispatches the attendance request. | ⬜ |
| **TC-06** | **Unregistered Fingerprint** | Touching the sensor with an unregistered finger vibrates with "Not recognized" and allows re-try. | ⬜ |
| **TC-07** | **PIN Fallback Blocked** | The biometric prompt does NOT offer a "Use PIN" fallback option (enforced via `disableDeviceFallback: true`). | ⬜ |
| **TC-08** | **Prompt Cancellation** | Tapping "Cancel" dismisses the prompt and returns smoothly to the Confirmation Modal without freezing. | ⬜ |
| **TC-09** | **Sensor Lockout** | 5 consecutive bad scans trigger a temporary 30-second lockout with clear user alert. | ⬜ |
| **TC-10** | **Server Success Confirmation** | Server responds with 200 OK $\rightarrow$ full-screen green confirmation displays employee name, server time in IST, and 5-second countdown. | ⬜ |
| **TC-11** | **Simultaneous Web Sync** | Punching in/out on the phone reflects instantly on the VIDYACRM web dashboard for that user. | ⬜ |
| **TC-12** | **Duplicate Tap Prevention** | Tapping rapidly on the action button is debounced; duplicate requests return cached result. | ⬜ |
| **TC-13** | **Inactivity Watchdog** | Selecting an employee card and walking away causes the modal to close and reset to the directory after 30 seconds. | ⬜ |
| **TC-14** | **Screen Sleep Prevention** | Screen remains continuously illuminated during office hours via `expo-keep-awake`. | ⬜ |
| **TC-15** | **Network Disconnection** | Disabling Wi-Fi immediately updates Header status badge to "OFFLINE" and displays a clear network alert upon tap. | ⬜ |

---

## 4. Important Security Disclosure: Biometric Identity Limitation

> [!WARNING]
> **OPERATIONAL NOTICE: Local Biometric Matching vs. Employee Identification**
> 
> The Samsung Galaxy M32's capacitive sensor and Android's `BiometricPrompt` API operate as a **1:1 local authentication gate**, NOT a 1:N biometric identification system:
> 
> 1. The phone's sensor only verifies whether *a fingerprint enrolled in the phone's Android settings* was scanned.
> 2. Android **does not reveal whose finger was scanned** or return biometric template data to the app.
> 3. If multiple employees' fingers are enrolled on the device, **Employee A could tap Employee B's name and scan Employee A's finger to punch for Employee B (buddy punching).**
> 
> **Operating Recommendation:**
> - Deploy the kiosk terminal in a visible, supervised studio reception area.
> - Keep the device lockscreen PIN strictly confidential to prevent unauthorized employees from enrolling their fingerprints in Android Settings.

