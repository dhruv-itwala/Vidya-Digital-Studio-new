import multer from "multer";
import AppError from "../StaffCRM/utils/AppError.js";

/* =========================================
   MEMORY STORAGE (Required for Cloudinary)
========================================= */
const storage = multer.memoryStorage();

/* =========================================
   FILE FILTER
========================================= */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",

    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // Excel
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    // Zip
    "application/zip",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new AppError("Unsupported file type uploaded", 400), false);
  }

  cb(null, true);
};

/* =========================================
   MULTER CONFIG
========================================= */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

export default upload;
