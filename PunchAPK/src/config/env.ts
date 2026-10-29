// PunchAPK/src/config/env.ts

export const DEFAULT_CONFIG = {
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL || "https://backend.vidyadigitalstudio.com/api/v1.0",
  deviceId:
    process.env.EXPO_PUBLIC_DEFAULT_DEVICE_ID || "M32-KIOSK-01",
  // SECURITY REQUIREMENT:
  // Device keys must NEVER be bundled into client APK binaries.
  // Device keys must be provisioned during hardware setup on-device into SecureStore.
  deviceKey: "",
};

export const KIOSK_STORAGE_KEYS = {
  API_URL: "vds_kiosk_api_url",
  DEVICE_ID: "vds_kiosk_device_id",
  DEVICE_KEY: "vds_kiosk_device_key",
  ADMIN_PIN: "vds_kiosk_admin_pin",
};
