// PunchAPK/src/services/biometric.service.ts
import * as LocalAuthentication from "expo-local-authentication";
import { BiometricCheckResult } from "../types";

/**
 * Checks whether the physical device (Samsung Galaxy M32) has biometric hardware
 * and enrolled fingerprints.
 */
export const checkBiometricSupport = async (): Promise<BiometricCheckResult> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    const supportedTypes: string[] = [];
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      supportedTypes.push("FINGERPRINT");
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      supportedTypes.push("FACIAL_RECOGNITION");
    }

    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
    };
  } catch (err) {
    console.error("Biometric hardware check failed:", err);
    return {
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
    };
  }
};

/**
 * Triggers native Android BiometricPrompt.
 * Enforces disableDeviceFallback: true so employees cannot bypass fingerprint using the phone's lockscreen PIN.
 */
export const authenticateKiosk = async (
  employeeName: string,
  actionText: string = "Attendance",
): Promise<{ success: boolean; error?: string }> => {
  try {
    const check = await checkBiometricSupport();

    if (!check.hasHardware) {
      return {
        success: false,
        error: "Biometric hardware is unavailable on this device.",
      };
    }

    if (!check.isEnrolled) {
      return {
        success: false,
        error: "No fingerprints are enrolled on this phone. Please enroll in Android Settings.",
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Scan Fingerprint for ${employeeName}`,
      cancelLabel: "Cancel",
      disableDeviceFallback: true, // STRICT: Prevent PIN/Pattern bypass
    });

    if (result.success) {
      return { success: true };
    }

    if (result.error === "user_cancel" || result.error === "app_cancel") {
      return { success: false, error: "Authentication cancelled" };
    }

    if (result.error === "lockout" || result.error === "lockout_permanent") {
      return {
        success: false,
        error: "Biometric sensor locked due to too many failed attempts. Try again in 30 seconds.",
      };
    }

    return {
      success: false,
      error: result.warning || "Fingerprint not recognized. Please try again.",
    };
  } catch (err: any) {
    console.error("Biometric prompt error:", err);
    return {
      success: false,
      error: err?.message || "Biometric authentication failed.",
    };
  }
};

