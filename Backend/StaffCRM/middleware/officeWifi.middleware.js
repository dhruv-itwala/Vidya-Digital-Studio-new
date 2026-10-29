// Backend/StaffCRM/middleware/officeWifi.middleware.js
import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import OfficeNetwork from "../Attendance/officeNetwork.model.js";

// In-memory cache for dynamic database office network configuration (TTL: 60s)
let cachedNetworkConfig = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000;

export const invalidateOfficeWifiCache = () => {
  cachedNetworkConfig = null;
  lastCacheTime = 0;
};

export const getDynamicOfficeNetwork = async () => {
  const now = Date.now();
  if (cachedNetworkConfig && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedNetworkConfig;
  }

  // Only query MongoDB if database connection is active (avoids buffering timeout in test envs)
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    return cachedNetworkConfig;
  }

  try {
    const config = await OfficeNetwork.findOne().lean();
    cachedNetworkConfig = config;
    lastCacheTime = now;
    return config;
  } catch (err) {
    console.warn("[OfficeWifi] Database read failed, using env fallback:", err.message);
    return null;
  }
};

/**
 * Extracts the real client public IP address from standard proxy headers.
 */
export const getClientPublicIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = forwarded.split(",").map((s) => s.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0].replace(/^::ffff:/, "");
    }
  }

  const remote = req.socket?.remoteAddress || req.ip || "UNKNOWN";
  return remote.replace(/^::ffff:/, "");
};

/**
 * Evaluates whether a request originates from the authorized Vidya Digital Studio Wi-Fi network.
 * Checks:
 * 1. Dynamic MongoDB configured officePublicIps
 * 2. Static OFFICE_WIFI_IPS environment variable
 * 3. Client local Wi-Fi subnet (default 192.168.0.x)
 */
export const verifyOfficeWifiAsync = async (req) => {
  const clientPublicIp = getClientPublicIp(req);
  const clientLocalIp = (req.headers["x-client-local-ip"] || "").trim();

  // 1. Fetch dynamic config from MongoDB
  const dynamicConfig = await getDynamicOfficeNetwork();

  // Combine DB IPs with env IPs
  const envOfficeIps = (process.env.OFFICE_WIFI_IPS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const dynamicOfficeIps = (dynamicConfig?.officePublicIps || [])
    .map((s) => s?.trim())
    .filter(Boolean);

  const allAuthorizedPublicIps = Array.from(
    new Set([...dynamicOfficeIps, ...envOfficeIps]),
  );

  const localSubnet =
    dynamicConfig?.localSubnet || process.env.OFFICE_LOCAL_SUBNET || "192.168.0.";

  // Check 1: Match authorized public broadband IP
  const matchesPublicIp =
    allAuthorizedPublicIps.length > 0 &&
    allAuthorizedPublicIps.some(
      (allowedIp) =>
        allowedIp === clientPublicIp || clientPublicIp.startsWith(allowedIp),
    );

  // Check 2: Match client local Wi-Fi subnet reported by device
  const matchesLocalSubnet =
    clientLocalIp.length > 0 && clientLocalIp.startsWith(localSubnet);

  // Check 3: Localhost development fallback in non-production
  const isDevLocalhost =
    process.env.NODE_ENV !== "production" &&
    (clientPublicIp === "127.0.0.1" || clientPublicIp === "::1");

  const isAuthorized = matchesPublicIp || matchesLocalSubnet || isDevLocalhost;

  return {
    isOfficeWifi: Boolean(isAuthorized),
    clientPublicIp,
    clientLocalIp: clientLocalIp || null,
    targetSubnet: localSubnet,
    configuredOfficeIps: allAuthorizedPublicIps,
    dynamicNetworkLabel: dynamicConfig?.networkLabel || null,
    lastUpdated: dynamicConfig?.updatedAt || null,
  };
};

/**
 * Synchronous variant used for fast local checks when DB is not awaited.
 */
export const verifyOfficeWifi = (req) => {
  const clientPublicIp = getClientPublicIp(req);
  const clientLocalIp = (req.headers["x-client-local-ip"] || "").trim();

  const envOfficeIps = (process.env.OFFICE_WIFI_IPS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const cachedIps = (cachedNetworkConfig?.officePublicIps || []).map((s) =>
    s?.trim(),
  );

  const allAuthorizedPublicIps = Array.from(
    new Set([...cachedIps, ...envOfficeIps]),
  );

  const localSubnet =
    cachedNetworkConfig?.localSubnet ||
    process.env.OFFICE_LOCAL_SUBNET ||
    "192.168.0.";

  const matchesPublicIp =
    allAuthorizedPublicIps.length > 0 &&
    allAuthorizedPublicIps.some(
      (allowedIp) =>
        allowedIp === clientPublicIp || clientPublicIp.startsWith(allowedIp),
    );

  const matchesLocalSubnet =
    clientLocalIp.length > 0 && clientLocalIp.startsWith(localSubnet);

  const isDevLocalhost =
    process.env.NODE_ENV !== "production" &&
    (clientPublicIp === "127.0.0.1" || clientPublicIp === "::1");

  const isAuthorized = matchesPublicIp || matchesLocalSubnet || isDevLocalhost;

  return {
    isOfficeWifi: Boolean(isAuthorized),
    clientPublicIp,
    clientLocalIp: clientLocalIp || null,
    targetSubnet: localSubnet,
    configuredOfficeIps: allAuthorizedPublicIps,
  };
};

/**
 * Middleware that blocks punch requests if the user is not connected to Studio Wi-Fi.
 */
export const requireOfficeWifi = async (req, res, next) => {
  try {
    const wifiStatus = await verifyOfficeWifiAsync(req);
    req.officeWifi = wifiStatus;

    if (!wifiStatus.isOfficeWifi) {
      return next(
        new AppError(
          "Attendance punch blocked: You must be connected to Vidya Digital Studio Wi-Fi (192.168.0.x) to punch in or out.",
          403,
        ),
      );
    }

    next();
  } catch (err) {
    next(err);
  }
};
