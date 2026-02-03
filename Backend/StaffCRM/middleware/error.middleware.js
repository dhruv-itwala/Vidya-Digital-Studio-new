import AppError from "../utils/AppError.js";
import multer from "multer";

export const globalErrorHandler = (err, req, res, next) => {
  console.error("=== GLOBAL ERROR HANDLER ===");
  console.error("Error message:", err.message);
  console.error("Error stack:", err.stack);
  console.error("========================");

  // Mongo duplicate key
  if (err.code === 11000) {
    err = new AppError("Duplicate field value", 400);
  }

  // Multer errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Operational errors (AppError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Fallback (programming / unknown errors)
  res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
};
