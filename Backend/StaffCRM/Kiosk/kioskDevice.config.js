// Backend/StaffCRM/Kiosk/kioskDevice.config.js
import crypto from "crypto";

/**
 * Registry of authorized kiosk hardware devices.
 * In production, keys can be set via KIOSK_DEVICE_KEYS environment variable:
 * e.g. "M32-KIOSK-01:sec_key_1,M32-KIOSK-02:sec_key_2"
 * or a single KIOSK_MASTER_KEY.
 */

// Default development key used ONLY in non-production environments
const DEFAULT_DEV_KIOSK = {
  deviceId: "M32-KIOSK-01",
  deviceKey: "vds_kiosk_secret_m32_dev_2026",
  name: "Reception Samsung Galaxy M32",
  isActive: true,
};

/**
 * Constant-time string comparison using SHA-256 digests.
 * Hashing both values to 32-byte buffers ensures identical length comparison,
 * preventing string-length timing leaks and buffer length mismatch exceptions.
 */
export const timingSafeCompare = (strA, strB) => {
  if (typeof strA !== "string" || typeof strB !== "string") return false;
  if (!strA || !strB) return false;

  const hashA = crypto.createHash("sha256").update(strA).digest();
  const hashB = crypto.createHash("sha256").update(strB).digest();
  return crypto.timingSafeEqual(hashA, hashB);
};

export const getAuthorizedKiosks = () => {
  const devices = new Map();

  // Load from KIOSK_DEVICE_KEYS env var (format: "devId1:key1,devId2:key2")
  if (process.env.KIOSK_DEVICE_KEYS) {
    const pairs = process.env.KIOSK_DEVICE_KEYS.split(",");
    for (const pair of pairs) {
      const [deviceId, deviceKey] = pair.split(":").map((s) => s?.trim());
      if (deviceId && deviceKey) {
        devices.set(deviceId, {
          deviceId,
          deviceKey,
          name: `Kiosk ${deviceId}`,
          isActive: true,
        });
      }
    }
  }

  // Support single KIOSK_MASTER_KEY for any deviceId
  if (process.env.KIOSK_MASTER_KEY) {
    devices.set("MASTER", {
      deviceId: "*",
      deviceKey: process.env.KIOSK_MASTER_KEY.trim(),
      name: "Master Kiosk Device",
      isActive: true,
    });
  }

  // Include default development device ONLY if no custom keys are configured
  // and environment is not explicitly production.
  if (devices.size === 0 && process.env.NODE_ENV !== "production") {
    devices.set(DEFAULT_DEV_KIOSK.deviceId, DEFAULT_DEV_KIOSK);
  }

  return devices;
};

/**
 * Validates whether the given deviceId and deviceKey match an authorized, active kiosk.
 * Uses SHA-256 constant-time comparison to prevent timing attacks.
 */
export const validateKioskDevice = (deviceId, deviceKey) => {
  if (!deviceId || !deviceKey) return false;

  const devices = getAuthorizedKiosks();

  // Check master key if provisioned
  const master = devices.get("MASTER");
  if (master && master.isActive) {
    if (timingSafeCompare(deviceKey, master.deviceKey)) {
      return true;
    }
  }

  // Check device-specific key
  const device = devices.get(deviceId);
  if (!device || !device.isActive) return false;

  return timingSafeCompare(deviceKey, device.deviceKey);
};
