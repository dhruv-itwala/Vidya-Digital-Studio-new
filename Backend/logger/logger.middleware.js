import APILog from "./Logger.model.js";

const IGNORED_ROUTES = [
  "/ping",
  "/users/dashboard",
  "/users/me",
  "/users",
  "/users/birthdays",
  "/users/admin/all",
];

export const apiLogger = (req, res, next) => {
  // 🚫 Skip if not admin
  if (!req.user || req.user.role !== "admin") {
    return next();
  }
  const url = req.originalUrl;

  // ❌ Skip ignored routes (partial match)
  const shouldIgnore = IGNORED_ROUTES.some((route) => url.includes(route));

  if (shouldIgnore) {
    return next();
  }

  const startTime = Date.now();

  res.on("finish", async () => {
    try {
      const duration = Date.now() - startTime;

      await APILog.create({
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: res.statusCode,

        // ✅ Admin info (VERY IMPORTANT)
        user: req.user.id,
        role: req.user.role,

        ip: req.ip,
        userAgent: req.headers["user-agent"],
        responseTime: duration,
      });
    } catch (err) {
      console.error("❌ Admin Log Error:", err.message);
    }
  });

  next();
};
