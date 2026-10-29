// PunchAPK/src/services/storage.service.ts
import * as SecureStore from "expo-secure-store";
import { DEFAULT_CONFIG, STORAGE_KEYS, KIOSK_STORAGE_KEYS } from "../config/env";
import { KioskConfig, AuthSession, UserProfile } from "../types";

export const getKioskConfig = async (): Promise<KioskConfig> => {
  try {
    const [storedUrl, storedId, storedKey] = await Promise.all([
      SecureStore.getItemAsync(KIOSK_STORAGE_KEYS.API_URL),
      SecureStore.getItemAsync(KIOSK_STORAGE_KEYS.DEVICE_ID),
      SecureStore.getItemAsync(KIOSK_STORAGE_KEYS.DEVICE_KEY),
    ]);

    return {
      apiUrl: storedUrl || DEFAULT_CONFIG.apiUrl,
      deviceId: storedId || DEFAULT_CONFIG.deviceId,
      deviceKey: storedKey || DEFAULT_CONFIG.deviceKey,
    };
  } catch (err) {
    console.warn("SecureStore read error, using default config:", err);
    return { ...DEFAULT_CONFIG };
  }
};

export const saveKioskConfig = async (config: Partial<KioskConfig>): Promise<void> => {
  try {
    if (config.apiUrl) {
      await SecureStore.setItemAsync(KIOSK_STORAGE_KEYS.API_URL, config.apiUrl.trim());
    }
    if (config.deviceId) {
      await SecureStore.setItemAsync(KIOSK_STORAGE_KEYS.DEVICE_ID, config.deviceId.trim());
    }
    if (config.deviceKey !== undefined) {
      await SecureStore.setItemAsync(KIOSK_STORAGE_KEYS.DEVICE_KEY, config.deviceKey.trim());
    }
  } catch (err) {
    console.error("SecureStore write error:", err);
    throw new Error("Failed to securely save kiosk configuration.");
  }
};

/**
 * Checks whether an Admin PIN has been configured on this hardware kiosk.
 * Returns true if a valid PIN exists; false if the terminal is unprovisioned.
 */
export const hasAdminPin = async (): Promise<boolean> => {
  try {
    const pin = await SecureStore.getItemAsync(KIOSK_STORAGE_KEYS.ADMIN_PIN);
    return Boolean(pin && pin.trim().length >= 4);
  } catch {
    return false;
  }
};

/**
 * Sets the initial Admin PIN on an unprovisioned kiosk.
 * Fails if an Admin PIN is already configured (cannot overwrite without authentication).
 */
export const setInitialAdminPin = async (newPin: string): Promise<void> => {
  const pin = newPin.trim();
  if (pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
    throw new Error("Admin PIN must be between 4 and 8 numeric digits.");
  }

  const alreadyConfigured = await hasAdminPin();
  if (alreadyConfigured) {
    throw new Error("An Admin PIN is already configured. Please authenticate to change it.");
  }

  try {
    await SecureStore.setItemAsync(KIOSK_STORAGE_KEYS.ADMIN_PIN, pin);
  } catch (err) {
    throw new Error("Failed to securely save Admin PIN.");
  }
};

/**
 * Saves a new Admin PIN directly (used during authenticated setup session).
 */
export const saveAdminPin = async (newPin: string): Promise<void> => {
  const pin = newPin.trim();
  if (pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
    throw new Error("Admin PIN must be between 4 and 8 numeric digits.");
  }
  try {
    await SecureStore.setItemAsync(KIOSK_STORAGE_KEYS.ADMIN_PIN, pin);
  } catch (err) {
    throw new Error("Failed to securely save Admin PIN.");
  }
};

/**
 * Changes an existing Admin PIN, requiring current PIN verification.
 */
export const changeAdminPin = async (currentPin: string, newPin: string): Promise<void> => {
  const isMatch = await verifyAdminPin(currentPin);
  if (!isMatch) {
    throw new Error("Current Admin PIN is incorrect.");
  }

  await saveAdminPin(newPin);
};

/**
 * Verifies a candidate Admin PIN against the stored secret in SecureStore.
 * If no Admin PIN is configured, returns false (setup required).
 */
export const verifyAdminPin = async (candidatePin: string): Promise<boolean> => {
  try {
    const storedPin = await SecureStore.getItemAsync(KIOSK_STORAGE_KEYS.ADMIN_PIN);
    if (!storedPin) return false;
    return candidatePin.trim() === storedPin.trim();
  } catch {
    return false;
  }
};

export const resetKioskConfig = async (): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(KIOSK_STORAGE_KEYS.API_URL),
      SecureStore.deleteItemAsync(KIOSK_STORAGE_KEYS.DEVICE_ID),
      SecureStore.deleteItemAsync(KIOSK_STORAGE_KEYS.DEVICE_KEY),
      SecureStore.deleteItemAsync(KIOSK_STORAGE_KEYS.ADMIN_PIN),
    ]);
  } catch (err) {
    console.warn("SecureStore reset error:", err);
  }
};

/**
 * Saves authenticated employee session (JWT token & profile) in hardware SecureStore.
 */
export const saveAuthSession = async (
  token: string,
  user: UserProfile,
): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token.trim()),
      SecureStore.setItemAsync(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user)),
    ]);
  } catch (err) {
    console.error("Failed to securely store auth session:", err);
    throw new Error("Unable to save authentication session.");
  }
};

/**
 * Retrieves the stored employee session if logged in.
 */
export const getAuthSession = async (): Promise<AuthSession | null> => {
  try {
    const [token, userJson] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.USER_PROFILE),
    ]);

    if (!token || !userJson) {
      return null;
    }

    return {
      token,
      user: JSON.parse(userJson) as UserProfile,
    };
  } catch (err) {
    console.warn("Error reading auth session from SecureStore:", err);
    return null;
  }
};

/**
 * Clears employee session on logout.
 */
export const clearAuthSession = async (): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.USER_PROFILE),
    ]);
  } catch (err) {
    console.warn("Error clearing auth session:", err);
  }
};
