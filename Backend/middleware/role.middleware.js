export const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role.toLowerCase())) {
      return res.status(403).json({
        message: "Forbidden: insufficient permissions",
      });
    }
    next();
  };
};
