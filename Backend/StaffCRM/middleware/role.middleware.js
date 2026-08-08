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

export const roleOrPermissionCheck = (allowedRoles, requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }
    if (req.user.role === "administrative" || req.user.role === "admin") {
      return next();
    }
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }
    const hasPermission = req.user.customPermissions && req.user.customPermissions.includes(requiredPermission);
    if (hasPermission) {
      return next();
    }
    throw new AppError(`Forbidden: insufficient permissions or requires '${requiredPermission}'`, 403);
  };
};
