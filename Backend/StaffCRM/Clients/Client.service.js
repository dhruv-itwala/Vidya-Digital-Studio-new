import mongoose from "mongoose";
import Client from "./Client.model.js";
import AppError from "../utils/AppError.js";
import {
  uploadImageToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinaryUpload.js";
import { parseIST } from "../utils/date.utils.js";

/* ================= CREATE CLIENT ================= */
export const createClientService = async (data, userId, file) => {
  data.createdBy = userId;

  // Upload profile photo if exists
  if (file) {
    const uploaded = await uploadImageToCloudinary(
      file,
      "Vidya Digital Studio/clients/profile",
    );

    data.profilePhoto = {
      url: uploaded.secure_url,
      public_id: uploaded.public_id,
    };
  }

  if (typeof data.services === "string") {
    try {
      data.services = JSON.parse(data.services);
    } catch {
      data.services = [];
    }
  }
  return Client.create(data);
};

/* ================= GET ALL CLIENTS ================= */
export const getAllClientsService = async ({
  page = 1,
  limit = 10,
  search,
}) => {
  const query = { isActive: true };

  if (search) {
    query.$or = [
      { clientName: { $regex: search, $options: "i" } },
      { ownerName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [clients, total] = await Promise.all([
    Client.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Client.countDocuments(query),
  ]);

  return {
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: clients,
  };
};

/* ================= GET CLIENT BY ID ================= */
export const getClientByIdService = async (clientId) => {
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    throw new AppError("Invalid client id", 400);
  }

  const client = await Client.findById(clientId).populate(
    "createdBy",
    "name email",
  );

  if (!client) throw new AppError("Client not found", 404);

  return client;
};

/* ================= UPDATE CLIENT ================= */
export const updateClientService = async (clientId, data, file) => {
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    throw new AppError("Invalid client id", 400);
  }

  const client = await Client.findById(clientId);
  if (!client) throw new AppError("Client not found", 404);

  // ✅ ALWAYS parse services (not inside file condition)
  if (typeof data.services === "string") {
    try {
      data.services = JSON.parse(data.services);
    } catch {
      delete data.services;
    }
  }

  // Replace profile photo if new file provided
  if (file) {
    if (client.profilePhoto?.public_id) {
      await deleteFromCloudinary(client.profilePhoto.public_id);
    }

    const uploaded = await uploadImageToCloudinary(
      file,
      "Vidya Digital Studio/clients/profile",
    );

    data.profilePhoto = {
      url: uploaded.secure_url,
      public_id: uploaded.public_id,
    };
  }

  return Client.findByIdAndUpdate(clientId, data, {
    new: true,
    runValidators: true,
  });
};

/* ================= DEACTIVATE CLIENT ================= */
export const deactivateClientService = async (clientId) => {
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    throw new AppError("Invalid client id", 400);
  }

  const client = await Client.findById(clientId);
  if (!client) throw new AppError("Client not found", 404);

  client.isActive = false;
  await client.save();

  return { deactivatedClientId: clientId };
};

/* ================= ADD CREDENTIAL ================= */
export const addCredentialService = async (clientId, credentialData) => {
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    throw new AppError("Invalid client id", 400);
  }

  const client = await Client.findById(clientId);
  if (!client) throw new AppError("Client not found", 404);

  // Store password as plain text
  client.credentials.push(credentialData);

  await client.save();

  return client;
};

/* ================= UPDATE CREDENTIAL ================= */
export const updateCredentialService = async (
  clientId,
  credentialId,
  credentialData,
) => {
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    throw new AppError("Invalid client id", 400);
  }

  const client = await Client.findById(clientId);
  if (!client) throw new AppError("Client not found", 404);

  const credIndex = client.credentials.findIndex(
    (cred) => cred._id.toString() === credentialId,
  );

  if (credIndex === -1) {
    throw new AppError("Credential not found", 404);
  }

  const existingCred = client.credentials[credIndex];

  // Update password
  if (credentialData.password !== undefined)
    existingCred.password = credentialData.password;

  // Update other fields
  if (credentialData.platform !== undefined)
    existingCred.platform = credentialData.platform;

  if (credentialData.username !== undefined)
    existingCred.username = credentialData.username;

  if (credentialData.note !== undefined)
    existingCred.note = credentialData.note;

  await client.save();

  return client;
};

/* ================= DELETE CREDENTIAL ================= */
export const deleteCredentialService = async (clientId, credentialId) => {
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    throw new AppError("Invalid client id", 400);
  }

  const client = await Client.findById(clientId);
  if (!client) throw new AppError("Client not found", 404);

  const credIndex = client.credentials.findIndex(
    (cred) => cred._id.toString() === credentialId,
  );

  if (credIndex === -1) {
    throw new AppError("Credential not found", 404);
  }

  client.credentials.splice(credIndex, 1);
  await client.save();

  return client;
};

/* ================= ADD TRANSACTION ================= */
export const addTransactionService = async (clientId, transactionData) => {
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    throw new AppError("Invalid client id", 400);
  }

  const client = await Client.findById(clientId);
  if (!client) throw new AppError("Client not found", 404);

  // ✅ Normalize date if provided
  if (transactionData.date) {
    transactionData.date = parseIST(transactionData.date);
  }

  client.transactions.push(transactionData);
  await client.save();

  return client;
};

/* ================= UPDATE TRANSACTION ================= */
export const updateTransactionService = async (
  clientId,
  transactionId,
  transactionData,
) => {
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    throw new AppError("Invalid client id", 400);
  }

  const client = await Client.findById(clientId);
  if (!client) throw new AppError("Client not found", 404);

  const transactionIndex = client.transactions.findIndex(
    (tx) => tx._id.toString() === transactionId,
  );

  if (transactionIndex === -1) {
    throw new AppError("Transaction not found", 404);
  }

  // ✅ Normalize date if being updated
  if (transactionData.date) {
    transactionData.date = parseIST(transactionData.date);
  }

  Object.assign(client.transactions[transactionIndex], transactionData);

  await client.save();

  return client;
};

/* ================= DELETE TRANSACTION ================= */
export const deleteTransactionService = async (clientId, transactionId) => {
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    throw new AppError("Invalid client id", 400);
  }

  const client = await Client.findById(clientId);
  if (!client) throw new AppError("Client not found", 404);

  const transactionIndex = client.transactions.findIndex(
    (tx) => tx._id.toString() === transactionId,
  );

  if (transactionIndex === -1) {
    throw new AppError("Transaction not found", 404);
  }

  client.transactions.splice(transactionIndex, 1);
  await client.save();

  return client;
};

/* ================= ADD DOCUMENT ================= */
export const addDocumentService = async (clientId, file) => {
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    throw new AppError("Invalid client id", 400);
  }

  const client = await Client.findById(clientId);
  if (!client) throw new AppError("Client not found", 404);

  const uploaded = await uploadImageToCloudinary(
    file,
    "Vidya Digital Studio/clients/documents",
  );
  const shortId = uploaded.public_id.split("/").pop();

  client.documents.push({
    name: file.originalname,
    url: uploaded.secure_url,
    public_id: shortId,
    type: file.mimetype,
    size: file.size,
  });

  await client.save();

  return client;
};

/* ================= DELETE DOCUMENT ================= */
export const deleteDocumentService = async (clientId, publicId) => {
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    throw new AppError("Invalid client id", 400);
  }

  const client = await Client.findById(clientId);
  if (!client) throw new AppError("Client not found", 404);

  const docIndex = client.documents.findIndex(
    (doc) => doc.public_id === publicId,
  );

  if (docIndex === -1) {
    throw new AppError("Document not found", 404);
  }

  await deleteFromCloudinary(
    `Vidya Digital Studio/clients/documents/${publicId}`,
  );

  client.documents.splice(docIndex, 1);
  await client.save();

  return client;
};
