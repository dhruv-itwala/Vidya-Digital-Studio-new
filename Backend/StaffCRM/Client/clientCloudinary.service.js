import fs from "fs";
import path from "path";
import cloudinary from "../../config/cloudinary.config.js";

const PROFILE_FOLDER = "Vidya Digital Studio/clients/profile-photos";
const DOCUMENT_FOLDER = "Vidya Digital Studio/clients/documents";

/* =========================================
   GENERIC UPLOAD FUNCTION
========================================= */
async function uploadBufferToCloudinary(buffer, filename, folder) {
  const tmpPath = path.join(process.cwd(), `${filename}_${Date.now()}`);

  fs.writeFileSync(tmpPath, buffer);

  try {
    const result = await cloudinary.uploader.upload(tmpPath, {
      folder,
      resource_type: "auto", // auto detect image/pdf/doc
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      size: result.bytes,
      type: result.resource_type,
    };
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch (e) {}
  }
}

/* =========================================
   PROFILE PHOTO
========================================= */
export async function uploadProfilePhoto(buffer, filename) {
  return uploadBufferToCloudinary(buffer, filename, PROFILE_FOLDER);
}

/* =========================================
   DOCUMENT UPLOAD
========================================= */
export async function uploadDocument(buffer, filename) {
  return uploadBufferToCloudinary(buffer, filename, DOCUMENT_FOLDER);
}

/* =========================================
   DELETE FILE
========================================= */
export async function deleteFileByPublicId(publicId, resourceType = "image") {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}
