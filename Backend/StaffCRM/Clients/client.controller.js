import { asyncHandler } from "../utils/asyncHandler.js";
import * as ClientService from "./Client.service.js";

/* ================= CREATE ================= */
export const createClient = asyncHandler(async (req, res) => {
  const client = await ClientService.createClientService(
    req.body,
    req.user._id,
    req.file,
  );

  res.status(201).json({
    success: true,
    message: "Client created successfully",
    data: client,
  });
});

/* ================= GET ALL CLIENTS ================= */
export const getAllClients = asyncHandler(async (req, res) => {
  const result = await ClientService.getAllClientsService({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

/* ================= GET ONE CLIENT BY ID ================= */
export const getClientById = asyncHandler(async (req, res) => {
  const client = await ClientService.getClientByIdService(req.params.id);

  res.status(200).json({
    success: true,
    data: client,
  });
});

/* ================= UPDATE CLIENT ================= */
export const updateClient = asyncHandler(async (req, res) => {
  const updated = await ClientService.updateClientService(
    req.params.id,
    req.body,
    req.file,
  );

  res.status(200).json({
    success: true,
    message: "Client updated successfully",
    data: updated,
  });
});

/* ================= DEACTIVATE CLIENT ================= */
export const deactivateClient = asyncHandler(async (req, res) => {
  const result = await ClientService.deactivateClientService(req.params.id);

  res.status(200).json({
    success: true,
    message: "Client deactivated",
    data: result,
  });
});

/* ================= ADD CREDENTIAL ================= */
export const addCredential = asyncHandler(async (req, res) => {
  const updated = await ClientService.addCredentialService(
    req.params.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Credential added",
    data: updated,
  });
});

/* ================= UPDATE CREDENTIAL ================= */
export const updateCredential = asyncHandler(async (req, res) => {
  const updated = await ClientService.updateCredentialService(
    req.params.id,
    req.params.credId,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Credential updated",
    data: updated,
  });
});

/* ================= DELETE CREDENTIAL ================= */
export const deleteCredential = asyncHandler(async (req, res) => {
  const updated = await ClientService.deleteCredentialService(
    req.params.id,
    req.params.credId,
  );

  res.status(200).json({
    success: true,
    message: "Credential deleted",
    data: updated,
  });
});

/* ================= ADD TRANSACTION ================= */
export const addTransaction = asyncHandler(async (req, res) => {
  const updated = await ClientService.addTransactionService(
    req.params.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Transaction added",
    data: updated,
  });
});

/* ================= UPDATE TRANSACTION ================= */
export const updateTransaction = asyncHandler(async (req, res) => {
  const updated = await ClientService.updateTransactionService(
    req.params.id,
    req.params.txnId,
    req.body,
  );
  res.status(200).json({
    success: true,
    message: "Transaction updated",
    data: updated,
  });
});

/* ================= DELETE TRANSACTION ================= */
export const deleteTransaction = asyncHandler(async (req, res) => {
  const updated = await ClientService.deleteTransactionService(
    req.params.id,
    req.params.txnId,
  );
  res.status(200).json({
    success: true,
    message: "Transaction deleted",
    data: updated,
  });
});

/* ================= ADD DOCUMENT ================= */
export const addDocument = asyncHandler(async (req, res) => {
  const updated = await ClientService.addDocumentService(
    req.params.id,
    req.file,
  );

  res.status(200).json({
    success: true,
    message: "Document uploaded",
    data: updated,
  });
});

/* ================= DELETE DOCUMENT ================= */
export const deleteDocument = asyncHandler(async (req, res) => {
  const updated = await ClientService.deleteDocumentService(
    req.params.id,
    req.params.publicId, // 👈 FIXED
  );

  res.status(200).json({
    success: true,
    message: "Document deleted",
    data: updated,
  });
});
