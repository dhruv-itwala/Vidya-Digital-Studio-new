// PunchAPK/src/config/env.ts

export const DEFAULT_CONFIG = {
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL || "http://backend.vidyadigitalstudio.com/api/v1.0",
  deviceId:
    process.env.EXPO_PUBLIC_DEFAULT_DEVICE_ID || "M32-KIOSK-01",
  deviceKey:
    process.env.EXPO_PUBLIC_DEFAULT_DEVICE_KEY || "vds_kiosk_secret_m32_dev_2026",
  studioLocalSubnet: "192.168.0.",
};

export const STORAGE_KEYS = {
  API_URL: "vds_kiosk_api_url",
  DEVICE_ID: "vds_kiosk_device_id",
  DEVICE_KEY: "vds_kiosk_device_key",
  ADMIN_PIN: "vds_kiosk_admin_pin",
  AUTH_TOKEN: "vds_employee_auth_token",
  USER_PROFILE: "vds_employee_user_profile",
};

export const KIOSK_STORAGE_KEYS = STORAGE_KEYS;
