import { asyncHandler } from "../utils/asyncHandler.js";
import * as ClientService from "./Client.service.js";
import { logActivity, captureBeforeState } from "../AuditLog/AuditLog.service.js";
import Client from "./Client.model.js";

/* ================= CREATE ================= */
export const createClient = asyncHandler(async (req, res) => {
  const client = await ClientService.createClientService(
    req.body,
    req.user._id,
    req.file,
  );

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    module: "Clients",
    action: "CREATE",
    entityId: client._id,
    entityName: client.companyName || client.clientName,
    description: `${req.user.name} created Client '${client.companyName || client.clientName}'`,
  });

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
  const beforeDoc = await captureBeforeState(Client, req.params.id);
  const updated = await ClientService.updateClientService(
    req.params.id,
    req.body,
    req.file,
  );

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    module: "Clients",
    action: "UPDATE",
    entityId: updated._id,
    entityName: updated.companyName || updated.clientName,
    description: `${req.user.name} updated Client '${updated.companyName || updated.clientName}'`,
    changes: { before: beforeDoc, after: updated },
  });

  res.status(200).json({
    success: true,
    message: "Client updated successfully",
    data: updated,
  });
});

/* ================= TOGGLE CLIENT STATUS ================= */
export const toggleClientStatus = asyncHandler(async (req, res) => {
  const result = await ClientService.toggleClientStatusService(req.params.id);

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    severity: "WARNING",
    module: "Clients",
    action: "STATUS_CHANGE",
    entityId: req.params.id,
    description: `${req.user.name} toggled active status for Client`,
  });

  res.status(200).json({
    success: true,
    message: "Client status toggled successfully",
    data: result,
  });
});

/* ================= DELETE CLIENT ================= */
export const deleteClient = asyncHandler(async (req, res) => {
  await ClientService.deleteClientService(req.params.id);
  logActivity({
    req,
    user: req.user,
    category: "CRM",
    severity: "CRITICAL",
    module: "Clients",
    action: "DELETE",
    entityId: req.params.id,
    description: `${req.user.name} deleted a Client permanently`,
  });

  res.status(200).json({
    success: true,
    message: "Client deleted successfully",
  });
});

/* ================= ADD CREDENTIAL ================= */
export const addCredential = asyncHandler(async (req, res) => {
  const updated = await ClientService.addCredentialService(
    req.params.id,
    req.body,
  );

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    severity: "SECURITY",
    module: "Clients",
    action: "UPDATE",
    entityId: updated._id,
    description: `${req.user.name} added credentials for Client`,
    changes: { after: req.body },
  });

  res.status(200).json({
    success: true,
    message: "Credential added",
    data: updated,
  });
});

/* ================= UPDATE CREDENTIAL ================= */
export const updateCredential = asyncHandler(async (req, res) => {
  const beforeDoc = await captureBeforeState(Client, req.params.id);
  const updated = await ClientService.updateCredentialService(
    req.params.id,
    req.params.credId,
    req.body,
  );

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    severity: "SECURITY",
    module: "Clients",
    action: "UPDATE",
    entityId: updated._id,
    description: `${req.user.name} updated credentials for Client`,
    changes: { before: beforeDoc, after: updated },
  });

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

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    severity: "SECURITY",
    module: "Clients",
    action: "DELETE",
    entityId: updated._id,
    description: `${req.user.name} deleted credentials for Client`,
  });

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

  logActivity({
    req,
    user: req.user,
    category: "Finance",
    severity: "WARNING",
    module: "Clients",
    action: "UPDATE",
    entityId: updated._id,
    description: `${req.user.name} added a transaction for Client`,
    changes: { after: req.body },
  });

  res.status(200).json({
    success: true,
    message: "Transaction added",
    data: updated,
  });
});

/* ================= UPDATE TRANSACTION ================= */
export const updateTransaction = asyncHandler(async (req, res) => {
  const beforeDoc = await captureBeforeState(Client, req.params.id);
  const updated = await ClientService.updateTransactionService(
    req.params.id,
    req.params.txnId,
    req.body,
  );
  logActivity({
    req,
    user: req.user,
    category: "Finance",
    severity: "WARNING",
    module: "Clients",
    action: "UPDATE",
    entityId: updated._id,
    description: `${req.user.name} updated a transaction for Client`,
    changes: { before: beforeDoc, after: updated },
  });

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
  logActivity({
    req,
    user: req.user,
    category: "Finance",
    severity: "WARNING",
    module: "Clients",
    action: "DELETE",
    entityId: updated._id,
    description: `${req.user.name} deleted a transaction for Client`,
  });

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

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    module: "Clients",
    action: "UPDATE",
    entityId: updated._id,
    description: `${req.user.name} uploaded a document for Client`,
  });

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

  logActivity({
    req,
    user: req.user,
    category: "CRM",
    severity: "WARNING",
    module: "Clients",
    action: "DELETE",
    entityId: updated._id,
    description: `${req.user.name} deleted a document for Client`,
  });

  res.status(200).json({
    success: true,
    message: "Document deleted",
    data: updated,
  });
});
