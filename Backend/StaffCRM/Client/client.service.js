import Client from "./client.model.js";
import AppError from "../utils/AppError.js";
import {
  deleteFromCloudinary,
  uploadImageToCloudinary,
} from "../utils/cloudinaryUpload.js";
import {
  deleteClientImageByPublicId,
  uploadClientImageFromBuffer,
} from "./clientCloudinary.service.js";

/* =========================
   HELPERS
========================= */
const parseJSON = (value) => {
  if (typeof value === "string") return JSON.parse(value);
  return value;
};

/* =========================
   SERVICES
========================= */
export const createClientService = async (data, userId, file) => {
  let profilePhoto;

  if (file) {
    const result = await uploadImageToCloudinary(
      file,
      "Vidya Digital Studio/clients/profile-photos",
    );

    profilePhoto = result.secure_url;
  }

  return Client.create({
    ...data,
    profilePhoto,
    services: parseJSON(data.services),
    transactions: parseJSON(data.transactions),
    credentials: parseJSON(data.credentials),
    createdBy: userId,
  });
};

export const updateClientService = async (id, data, file) => {
  const client = await Client.findById(id);
  if (!client) throw new AppError("Client not found", 404);

  // Upload new image if provided
  if (file) {
    // Delete old image (optional but recommended)
    if (client.profilePhoto) {
      const publicId = client.profilePhoto
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0];

      await deleteFromCloudinary(publicId);
    }

    const result = await uploadImageToCloudinary(
      file,
      "Vidya Digital Studio/clients/profile-photos",
    );

    data.profilePhoto = result.secure_url;
  }

  client.set({
    ...data,
    services: parseJSON(data.services),
    transactions: parseJSON(data.transactions),
    credentials: parseJSON(data.credentials),
  });

  return client.save();
};

export const getAllClientsService = async () => {
  return Client.find({ isActive: true }).sort({ createdAt: -1 });
};

export const getClientByIdService = async (id) => {
  const client = await Client.findById(id);
  if (!client) throw new AppError("Client not found", 404);
  return client;
};

export const deleteClientService = async (id) => {
  const client = await Client.findById(id);
  if (!client) throw new AppError("Client not found", 404);

  client.isActive = false;
  return client.save();
};

export const updateClientProfilePhotoService = async (id, base64Image) => {
  const client = await Client.findById(id);
  if (!client) throw new AppError("Client not found", 404);

  if (!base64Image) {
    throw new AppError("Profile photo is required", 400);
  }

  // 🔹 Decode base64
  const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new AppError("Invalid image format", 400);
  }

  const buffer = Buffer.from(matches[2], "base64");

  // 🔹 Delete old image if exists
  if (client.profilePhoto) {
    const publicId = client.profilePhoto
      .split("/")
      .slice(-2)
      .join("/")
      .split(".")[0];

    try {
      await deleteClientImageByPublicId(publicId);
    } catch (e) {
      console.warn("Old image delete failed:", e.message);
    }
  }

  // 🔹 Upload (quotation-style)
  const filenameBase = `client_${client._id}`;
  const upload = await uploadClientImageFromBuffer(buffer, filenameBase);

  client.profilePhoto = upload.url;
  await client.save();

  return client;
};
