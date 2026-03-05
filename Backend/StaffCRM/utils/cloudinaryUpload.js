// utils/cloudinaryUpload.js
import cloudinary from "../../config/cloudinary.config.js";
import { v4 as uuidv4 } from "uuid";

export const uploadImageToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const customId = uuidv4();
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          public_id: customId,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      )
      .end(file.buffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};
