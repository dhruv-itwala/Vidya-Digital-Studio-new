import Client from "./client.model.js";
import AppError from "../utils/AppError.js";
import {
  uploadProfilePhoto,
  uploadDocument,
  deleteFileByPublicId,
} from "./clientCloudinary.service.js";

/* =========================
   HELPERS
========================= */

const parseJSON = (value, defaultValue = []) => {
  if (!value) return defaultValue;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }

  return value;
};

const parseServices = (services) => {
  if (!services) return [];

  if (typeof services === "string") {
    try {
      return JSON.parse(services);
    } catch {
      return [];
    }
  }

  if (Array.isArray(services)) return services;

  return [];
};

/* =========================
   CREATE CLIENT
========================= */

export const createClientService = async (data, userId, profileFile) => {
  let profilePhoto;

  if (profileFile) {
    const upload = await uploadProfilePhoto(
      profileFile.buffer,
      `client_${Date.now()}`,
    );

    profilePhoto = {
      url: upload.url,
      public_id: upload.public_id,
    };
  }

  const client = await Client.create({
    ...data,
    profilePhoto,
    services: parseServices(data.services),
    transactions: parseJSON(data.transactions),
    credentials: parseJSON(data.credentials),
    createdBy: userId,
  });

  return client;
};

/* =========================
   UPDATE CLIENT
========================= */

export const updateClientService = async (id, data, profileFile) => {
  const client = await Client.findById(id);
  if (!client) throw new AppError("Client not found", 404);

  /* ---- Replace Profile Photo ---- */
  if (profileFile) {
    if (client.profilePhoto?.public_id) {
      await deleteFileByPublicId(client.profilePhoto.public_id);
    }

    const upload = await uploadProfilePhoto(profileFile.buffer, `client_${id}`);

    client.profilePhoto = {
      url: upload.url,
      public_id: upload.public_id,
    };
  }

  /* ---- Safe Update ---- */
  if (data.clientName) client.clientName = data.clientName;
  if (data.ownerName) client.ownerName = data.ownerName;
  if (data.email) client.email = data.email;
  if (data.phone) client.phone = data.phone;
  if (data.address) client.address = data.address;
  if (data.billingType) client.billingType = data.billingType;
  if (data.totalAmount) client.totalAmount = data.totalAmount;
  if (data.monthlyAmount) client.monthlyAmount = data.monthlyAmount;
  if (data.tenure) client.tenure = data.tenure;
  if (data.paymentStatus) client.paymentStatus = data.paymentStatus;
  if (data.notes) client.notes = data.notes;

  if (data.services) {
    client.services = parseServices(data.services);
  }

  if (data.transactions) {
    client.transactions = parseJSON(data.transactions);
  }

  if (data.credentials) {
    client.credentials = parseJSON(data.credentials);
  }

  return client.save();
};

/* =========================
   UPLOAD DOCUMENTS
========================= */

export const uploadClientDocumentsService = async (clientId, files) => {
  const client = await Client.findById(clientId);
  if (!client) throw new AppError("Client not found", 404);

  for (const file of files) {
    const upload = await uploadDocument(file.buffer, file.originalname);

    client.documents.push({
      name: file.originalname,
      url: upload.url,
      public_id: upload.public_id,
      type: file.mimetype,
      size: upload.size,
    });
  }

  await client.save();
  return client.documents;
};

/* =========================
   DELETE DOCUMENT
========================= */
export const deleteClientDocumentService = async (clientId, documentId) => {
  const client = await Client.findById(clientId);
  if (!client) throw new AppError("Client not found", 404);

  const document = client.documents.id(documentId);
  if (!document) throw new AppError("Document not found", 404);

  if (document.public_id) {
    await deleteFileByPublicId(document.public_id, "raw");
  }

  document.deleteOne(); // better than remove()
  await client.save();

  return true;
};

/* =========================
   GET ALL
========================= */

export const getAllClientsService = async () => {
  return Client.find({ isActive: true }).sort({
    createdAt: -1,
  });
};

/* =========================
   GET ONE
========================= */

export const getClientByIdService = async (id) => {
  const client = await Client.findOne({
    _id: id,
    isActive: true,
  });

  if (!client) throw new AppError("Client not found", 404);

  return client;
};

/* =========================
   SOFT DELETE
========================= */

export const deleteClientService = async (id) => {
  const client = await Client.findById(id);
  if (!client) throw new AppError("Client not found", 404);

  client.isActive = false;
  await client.save();

  return true;
};
