// middleware/auth.middleware.js
import AppError from "../utils/AppError.js";
import { verifyToken } from "../utils/jwt.util.js";

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Unauthorized", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token); // { id, role }
    req.user = decoded;
    next();
  } catch (err) {
    throw new AppError("Invalid or expired token", 401);
  }
};
