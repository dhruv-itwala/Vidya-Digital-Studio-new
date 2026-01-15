// middlewares/error.middleware.js
import AppError from "../utils/AppError.js";

export const globalErrorHandler = (err, req, res, next) => {
  // Mongo duplicate key
  if (err.code === 11000) {
    err = new AppError("Duplicate field value", 400);
  }

  const status = err.statusCode || 500;

  res.status(status).json({
    success: false,
    message: err.message || "Something went wrong",
  });
};
