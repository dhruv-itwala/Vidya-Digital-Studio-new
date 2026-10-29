// Backend/StaffCRM/middleware/kioskAuth.middleware.js
import AppError from "../utils/AppError.js";
import { validateKioskDevice } from "../Kiosk/kioskDevice.config.js";

/**
 * Authentication middleware for dedicated Android attendance kiosk terminals.
 * Requires X-Kiosk-Device-Id and X-Kiosk-Device-Key headers.
 */
export const kioskAuth = (req, res, next) => {
  const deviceId =
    req.headers["x-kiosk-device-id"] || req.headers["x-device-id"];
  const deviceKey =
    req.headers["x-kiosk-device-key"] || req.headers["x-device-key"];

  if (!deviceId || !deviceKey) {
    return next(
      new AppError(
        "Unauthorized kiosk request: missing device credentials (X-Kiosk-Device-Id, X-Kiosk-Device-Key)",
        401,
      ),
    );
  }

  const isValid = validateKioskDevice(deviceId, deviceKey);
  if (!isValid) {
    return next(
      new AppError(
        "Unauthorized kiosk request: invalid or revoked device credentials",
        401,
      ),
    );
  }

  req.kiosk = {
    deviceId: String(deviceId).trim(),
    authorizedAt: new Date(),
  };

  next();
};

