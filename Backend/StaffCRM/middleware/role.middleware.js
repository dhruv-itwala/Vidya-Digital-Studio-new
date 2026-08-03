// middleware/role.middleware.js
import AppError from "../utils/AppError.js";

export const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }
    // Super administrative role bypasses all checks
    if (req.user.role === "administrative") {
      return next();
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }
    next();
  };
};

export const permissionCheck = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }
    
    // Super administrative role or Admin bypasses permission checks (if needed, or maybe just administrative)
    // We will allow 'administrative' and 'admin' to bypass, depending on business logic. Let's allow 'administrative' to always bypass.
    if (req.user.role === "administrative") {
      return next();
    }

    const hasPermission = req.user.customPermissions && req.user.customPermissions.includes(requiredPermission);
    if (!hasPermission) {
      throw new AppError(`Forbidden: requires permission '${requiredPermission}'`, 403);
    }
    next();
  };
};
