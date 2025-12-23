import { verifyToken } from "../utils/jwt.util.js";
export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token); // must return payload { id, role }

    req.user = decoded;
    next();
  } catch (err) {
    console.error(err.message); // log for debugging
    res.status(401).json({ message: "Unauthorized" });
  }
};
