// middleware/auth.middleware.js
import AppError from "../utils/AppError.js";
import { verifyToken } from "../utils/jwt.util.js";

import User from "../Users/user.model.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token); // { id, role }
    
    // Fetch user to get up-to-date customPermissions
    const user = await User.findById(decoded.id).lean();
    if (!user || !user.isActive) {
      return next(new AppError("User not found or inactive", 401));
    }

    req.user = user;
    req.user._id = user._id; 
    req.user.id = user._id.toString();
    next();
  } catch (err) {
    return next(new AppError("Invalid or expired token", 401));
  }
};

  export const clientProtect = (req, res, next) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401);
    }
  
    const token = authHeader.split(" ")[1];
  
    try {
      const decoded = verifyToken(token);
      if (decoded.role !== "client") {
        throw new AppError("Forbidden: Clients only", 403);
      }
      req.client = decoded;
      next();
    } catch (err) {
      throw new AppError("Invalid or expired token", 401);
    }
  };
