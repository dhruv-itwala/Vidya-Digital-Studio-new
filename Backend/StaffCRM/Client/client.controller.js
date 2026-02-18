import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createClientService,
  updateClientService,
  getAllClientsService,
  getClientByIdService,
  deleteClientService,
  uploadClientDocumentsService,
  deleteClientDocumentService,
} from "./client.service.js";

/* =========================================
   CREATE CLIENT
========================================= */
export const createClient = asyncHandler(async (req, res) => {
  const client = await createClientService(
    req.body,
    req.user?.id, // make sure protect middleware is enabled
    req.file, // profilePhoto
  );

  res.status(201).json({
    success: true,
    data: client,
  });
});

/* =========================================
   UPDATE CLIENT
========================================= */
export const updateClient = asyncHandler(async (req, res) => {
  const client = await updateClientService(
    req.params.id,
    req.body,
    req.file, // optional profilePhoto
  );

  res.json({
    success: true,
    data: client,
  });
});

/* =========================================
   UPLOAD DOCUMENTS
========================================= */
export const uploadClientDocuments = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No documents uploaded",
    });
  }

  const documents = await uploadClientDocumentsService(
    req.params.id,
    req.files,
  );

  res.json({
    success: true,
    message: "Documents uploaded successfully",
    data: documents,
  });
});

/* =========================================
   DELETE DOCUMENT
========================================= */
export const deleteClientDocument = asyncHandler(async (req, res) => {
  await deleteClientDocumentService(req.params.clientId, req.params.documentId);

  res.json({
    success: true,
    message: "Document deleted successfully",
  });
});

/* =========================================
   GET ALL CLIENTS
========================================= */
export const getAllClients = asyncHandler(async (req, res) => {
  const clients = await getAllClientsService();

  res.json({
    success: true,
    data: clients,
  });
});

/* =========================================
   GET SINGLE CLIENT
========================================= */
export const getClientById = asyncHandler(async (req, res) => {
  const client = await getClientByIdService(req.params.id);

  res.json({
    success: true,
    data: client,
  });
});

/* =========================================
   SOFT DELETE CLIENT
========================================= */
export const deleteClient = asyncHandler(async (req, res) => {
  await deleteClientService(req.params.id);

  res.json({
    success: true,
    message: "Client deleted successfully",
  });
});
