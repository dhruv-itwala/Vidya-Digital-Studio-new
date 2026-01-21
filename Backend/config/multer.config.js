// config/multer.config.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.config.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith("image/");

    return {
      folder: "Vidya Digital Studio/Client",
      resource_type: isImage ? "image" : "raw",
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
      format: isImage ? "webp" : undefined, // ✅ auto convert images only
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "application/pdf", "video/mp4"];
    cb(null, allowed.includes(file.mimetype));
  },
});

export default upload;
