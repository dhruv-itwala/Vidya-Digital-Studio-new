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
  const { documentsMeta } = req.body;

  const payload = { ...req.body };

  // ✅ FIX: parse JSON fields
  if (typeof payload.transactions === "string") {
    payload.transactions = JSON.parse(payload.transactions);
  }

  if (typeof payload.credentials === "string") {
    payload.credentials = JSON.parse(payload.credentials);
  }

  // profile photo update
  if (req.files?.profilePhoto?.[0]) {
    payload.profilePhoto = req.files.profilePhoto[0].path;
  }

  // documents update (append)
  if (req.files?.documents && documentsMeta) {
    const meta = JSON.parse(documentsMeta);

    payload.$push = {
      documents: req.files.documents.map((file, i) => ({
        name: meta[i]?.name,
        url: file.path,
      })),
    };
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
