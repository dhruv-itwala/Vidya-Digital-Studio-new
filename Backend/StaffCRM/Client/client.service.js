import Client from "./client.model.js";
import AppError from "../utils/AppError.js";

/* =========================
   PAYMENT STATUS CALC
========================= */
const calculatePaymentStatus = (client) => {
  const totalPaid = client.transactions.reduce((sum, t) => sum + t.amount, 0);

  // ONE TIME
  if (client.billingType === "one-time") {
    if (!client.totalAmount) return "pending";
    if (totalPaid === 0) return "pending";
    if (totalPaid < client.totalAmount) return "partial";
    return "paid";
  }

  // MONTHLY
  if (client.billingType === "monthly") {
    const expectedTotal = client.monthlyAmount * client.tenure;

    client.paidMonths = Math.floor(totalPaid / client.monthlyAmount);

    if (totalPaid === 0) return "pending";
    if (totalPaid < expectedTotal) return "partial";
    return "paid";
  }
};

/* =========================
   CREATE CLIENT
========================= */
export const createClientService = async (payload) => {
  const client = await Client.create(payload);
  return client;
};

/* =========================
   UPDATE CLIENT
========================= */
export const updateClientService = async (id, payload) => {
  const client = await Client.findOne({ _id: id, isDeleted: false });
  if (!client) throw new AppError("Client not found", 404);

  // ✅ Handle services array properly
  if (payload.services && Array.isArray(payload.services)) {
    client.services = payload.services;
    delete payload.services;
  }

  // ✅ Handle documents array properly
  if (payload.documents && Array.isArray(payload.documents)) {
    client.documents = payload.documents;
    delete payload.documents;
  }

  // ✅ Assign remaining fields
  Object.assign(client, payload);

  // ✅ Auto update payment status
  client.paymentStatus = calculatePaymentStatus(client);

  await client.save();
  return client;
};
/* =========================
   GET ALL CLIENTS
========================= */
export const getAllClientsService = async () => {
  return Client.find({ isDeleted: false }).sort({ createdAt: -1 });
};

/* =========================
   GET CLIENT BY ID
========================= */
export const getClientByIdService = async (id) => {
  const client = await Client.findOne({ _id: id, isDeleted: false });
  if (!client) throw new AppError("Client not found", 404);
  return client;
};

/* =========================
   SOFT DELETE CLIENT
========================= */
export const deleteClientService = async (id) => {
  const client = await Client.findById(id);
  if (!client) throw new AppError("Client not found", 404);

  client.isDeleted = true;
  client.deletedAt = new Date();
  await client.save();
};
