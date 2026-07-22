import AuditLog from "./AuditLog.model.js";

const SENSITIVE_FIELDS = [
  "password",
  "token",
  "jwt",
  "otp",
  "secret",
  "cookie",
  "authorization",
  "credentials",
];

const scrubData = (data) => {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => scrubData(item));
  }

  const scrubbed = { ...data };
  for (const key of Object.keys(scrubbed)) {
    if (SENSITIVE_FIELDS.some((sf) => key.toLowerCase().includes(sf))) {
      scrubbed[key] = "***MASKED***";
    } else if (typeof scrubbed[key] === "object" && scrubbed[key] !== null) {
      scrubbed[key] = scrubData(scrubbed[key]);
    }
  }
  return scrubbed;
};

export const captureBeforeState = async (Model, id) => {
  if (!Model || !id) return undefined;
  try {
    return await Model.findById(id).lean();
  } catch (err) {
    return undefined; // Fail silently so we don't break the API
  }
};

const isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date);
const isObjectId = (val) => val?.constructor?.name === "ObjectId" || /^[0-9a-fA-F]{24}$/.test(val?.toString());

export const getDeepDiff = (before, after) => {
  if (!before || !after) return undefined;

  const ignore = ["__v", "updatedAt", "createdAt"];

  const getDiff = (obj1, obj2) => {
    const changes = { before: {}, after: {} };
    let hasChanges = false;

    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    for (const key of keys) {
      if (ignore.includes(key)) continue;

      const val1 = obj1?.[key];
      const val2 = obj2?.[key];

      if (val1 === val2) continue;

      if (val1 === undefined || val2 === undefined) {
        changes.before[key] = val1;
        changes.after[key] = val2;
        hasChanges = true;
        continue;
      }

      if (val1 instanceof Date || val2 instanceof Date) {
        if (new Date(val1).getTime() !== new Date(val2).getTime()) {
          changes.before[key] = val1;
          changes.after[key] = val2;
          hasChanges = true;
        }
        continue;
      }

      if (isObjectId(val1) || isObjectId(val2)) {
        if (val1?.toString() !== val2?.toString()) {
          changes.before[key] = val1;
          changes.after[key] = val2;
          hasChanges = true;
        }
        continue;
      }

      if (Array.isArray(val1) && Array.isArray(val2)) {
        let arrayChanged = val1.length !== val2.length;
        if (!arrayChanged) {
          // Use basic string comparison for array elements to safely compare without full recursive matrix
          for (let i = 0; i < val1.length; i++) {
            if (String(val1[i]) !== String(val2[i]) && JSON.stringify(val1[i]) !== JSON.stringify(val2[i])) {
              arrayChanged = true;
              break;
            }
          }
        }
        if (arrayChanged) {
          changes.before[key] = val1;
          changes.after[key] = val2;
          hasChanges = true;
        }
        continue;
      }

      if (isObject(val1) && isObject(val2)) {
        const nestedDiff = getDiff(val1, val2);
        if (nestedDiff) {
          changes.before[key] = nestedDiff.before;
          changes.after[key] = nestedDiff.after;
          hasChanges = true;
        }
        continue;
      }

      if (val1 !== val2) {
        changes.before[key] = val1;
        changes.after[key] = val2;
        hasChanges = true;
      }
    }

    return hasChanges ? changes : undefined;
  };

  return getDiff(before, after);
};

const parseUserAgent = (ua) => {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "Unknown", raw: "Unknown" };

  const raw = ua;
  let browser = "Other";
  let os = "Other";
  let device = "Desktop";

  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  if (/Mobile|Android|iP(hone|od|ad)/i.test(ua)) device = "Mobile";

  return { browser, os, device, raw };
};

export const logActivity = async ({
  req,
  user,
  category,
  severity = "INFO",
  module,
  action,
  entityId,
  entityName,
  description,
  changes,
  metadata,
  status = "SUCCESS",
}) => {
  try {
    let ipAddress =
      req?.headers?.["x-forwarded-for"] ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      "Unknown";
      
    if (ipAddress === "::1") ipAddress = "127.0.0.1";

    const userAgentRaw = req?.headers?.["user-agent"] || "Unknown";
    const userAgent = parseUserAgent(userAgentRaw);
    
    const requestId = req?.requestId;
    const responseTimeMs = req?.startTime ? Date.now() - req.startTime : 0;

    let computedChanges = undefined;

    // Deep Diff Tracking
    if (changes && changes.before && changes.after) {
       // Deep diff will compute differences and ignore __v
       const afterDoc = changes.after.toObject ? changes.after.toObject() : changes.after;
       const diff = getDeepDiff(changes.before, afterDoc);
       if (diff) {
         computedChanges = {
           before: scrubData(diff.before),
           after: scrubData(diff.after)
         };
       }
    } else if (changes && changes.after && !changes.before) {
       computedChanges = { after: scrubData(changes.after) };
    }

    // Fire-and-forget logging
    AuditLog.create({
      requestId,
      user: user?._id || user?.id,
      userName: user?.name,
      userRole: user?.role,
      category,
      severity,
      action,
      module,
      entityId,
      entityName,
      description,
      changes: computedChanges,
      metadata: scrubData(metadata),
      ipAddress,
      userAgent,
      responseTimeMs,
      requestMethod: req?.method || "Unknown",
      requestUrl: req?.originalUrl || "Unknown",
      status,
    }).catch((err) => {
      console.error(`❌ [AuditLog] RequestId: ${requestId} - ${err.message}`);
    });
  } catch (err) {
    console.error(`❌ [AuditLog Init] Error: ${err.message}`);
  }
};
