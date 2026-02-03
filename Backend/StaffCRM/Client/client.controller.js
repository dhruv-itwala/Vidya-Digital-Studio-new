import {
  createClientService,
  updateClientService,
  getAllClientsService,
  getClientByIdService,
  deleteClientService,
} from "./client.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* =========================
   CREATE CLIENT
========================= */
export const createClient = asyncHandler(async (req, res) => {
  const { documentsMeta } = req.body;

  // profile photo
  const profilePhoto = req.files?.profilePhoto?.[0]?.path;

  // documents
  let documents = [];
  if (req.files?.documents && documentsMeta) {
    const meta = JSON.parse(documentsMeta);
    documents = req.files.documents.map((file, i) => ({
      name: meta[i]?.name,
      url: file.path,
    }));
  }

  // ✅ FIX: parse JSON fields from multipart
  if (typeof req.body.transactions === "string") {
    req.body.transactions = JSON.parse(req.body.transactions);
  }

  if (typeof req.body.credentials === "string") {
    req.body.credentials = JSON.parse(req.body.credentials);
  }

  const client = await createClientService({
    ...req.body,
    profilePhoto,
    documents,
    createdBy: req.user.id,
  });

  res.status(201).json({
    success: true,
    data: client,
  });
});

/* =========================
   UPDATE CLIENT
========================= */
export const updateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { keepDocuments, replaceDocuments, newDocuments } = req.body;

  const payload = { ...req.body };

  // ✅ Remove document metadata from payload
  delete payload.keepDocuments;
  delete payload.replaceDocuments;
  delete payload.newDocuments;

  // ✅ Parse JSON fields
  if (typeof payload.transactions === "string") {
    payload.transactions = JSON.parse(payload.transactions);
  }

  if (typeof payload.credentials === "string") {
    payload.credentials = JSON.parse(payload.credentials);
  }

  if (typeof payload.services === "string") {
    payload.services = JSON.parse(payload.services);
  }

  // ✅ Handle profile photo update
  if (req.files?.profilePhoto?.[0]) {
    payload.profilePhoto = req.files.profilePhoto[0].path;
  }

  // ✅ Handle documents properly
  let finalDocuments = [];

  // 1. Keep existing documents
  if (keepDocuments) {
    const kept = JSON.parse(keepDocuments);
    finalDocuments.push(...kept);
  }

  // 2. Handle replacements
  if (replaceDocuments && req.files?.documents) {
    const replacements = JSON.parse(replaceDocuments);
    const uploadedFiles = req.files.documents;

    replacements.forEach((doc, index) => {
      if (uploadedFiles[index]) {
        finalDocuments.push({
          _id: doc._id,
          name: doc.name,
          url: uploadedFiles[index].path, // new URL
        });
      }
    });
  }

  // 3. Add new documents
  if (newDocuments && req.files?.documents) {
    const newDocs = JSON.parse(newDocuments);
    const startIndex = replaceDocuments
      ? JSON.parse(replaceDocuments).length
      : 0;
    const uploadedFiles = req.files.documents;

    newDocs.forEach((doc, index) => {
      const fileIndex = startIndex + index;
      if (uploadedFiles[fileIndex]) {
        finalDocuments.push({
          name: doc.name,
          url: uploadedFiles[fileIndex].path,
        });
      }
    });
  }

  // Only update documents if there were changes
  if (keepDocuments || replaceDocuments || newDocuments) {
    payload.documents = finalDocuments;
  }

  const client = await updateClientService(id, payload);

  res.json({
    success: true,
    data: client,
  });
});

/* =========================
   GET ALL CLIENTS
========================= */
export const getAllClients = asyncHandler(async (req, res) => {
  const clients = await getAllClientsService();
  res.json({ success: true, data: clients });
});

/* =========================
   GET CLIENT BY ID
========================= */
export const getClientById = asyncHandler(async (req, res) => {
  const client = await getClientByIdService(req.params.id);
  res.json({ success: true, data: client });
});

/* =========================
   DELETE CLIENT (SOFT)
========================= */
export const deleteClient = asyncHandler(async (req, res) => {
  await deleteClientService(req.params.id);
  res.json({ success: true, message: "Client deleted successfully" });
});
