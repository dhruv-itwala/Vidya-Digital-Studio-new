// services/cloudinary.service.js
import cloudinary from "../../config/cloudinary.config.js";
import fs from "fs";
import path from "path";

const DEFAULT_FOLDER =
  process.env.UPLOAD_FOLDER || "Vidya Digital Studio/quotations";
const EXPIRE_DAYS = Number(process.env.PDF_EXPIRE_DAYS || 7);

export async function uploadBufferToCloudinary(buffer, filenameBase = "quote") {
  const tmpPath = path.join(process.cwd(), `${filenameBase}_${Date.now()}.pdf`);
  fs.writeFileSync(tmpPath, buffer);

  try {
    const expires_at = Math.floor(Date.now() / 1000) + EXPIRE_DAYS * 24 * 3600;

    const result = await cloudinary.uploader.upload(tmpPath, {
      resource_type: "raw",
      folder: DEFAULT_FOLDER,
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      expires_at,
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      expires_at: new Date(expires_at * 1000),
    };
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch (e) {}
  }
}

export async function deleteByPublicId(publicId) {
  return await cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
}
