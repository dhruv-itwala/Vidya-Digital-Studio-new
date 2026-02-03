// config/multer.config.js
import multer from "multer";
import AppError from "../StaffCRM/utils/AppError.js";

// Use memory storage (best for Cloudinary)
const storage = multer.memoryStorage();

// File filter (images only for now)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new AppError("Only JPG, PNG, WEBP images are allowed", 400),
      false,
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  // limits: {
  //   fileSize: 5 * 1024 * 1024, // 5 MB
  // },
});

export default upload;
