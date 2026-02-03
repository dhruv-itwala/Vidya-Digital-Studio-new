import fs from "fs";
import path from "path";
import cloudinary from "../../config/cloudinary.config.js";

const CLIENT_FOLDER = "Vidya Digital Studio/clients/profile-photos";

export async function uploadClientImageFromBuffer(buffer, filenameBase) {
  const tmpPath = path.join(process.cwd(), `${filenameBase}_${Date.now()}.png`);

  fs.writeFileSync(tmpPath, buffer);

  try {
    const result = await cloudinary.uploader.upload(tmpPath, {
      folder: CLIENT_FOLDER,
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch (e) {}
  }
}

export async function deleteClientImageByPublicId(publicId) {
  return cloudinary.uploader.destroy(publicId);
}
