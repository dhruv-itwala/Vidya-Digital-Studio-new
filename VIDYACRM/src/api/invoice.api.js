// VIDYACRM/src/api/invoice.api.js
import api from "./axios";

// Fetch auto-incremented invoice number (e.g. IND/2026 : #1001)
export const getNextInvoiceNumberAPI = () => {
  return api.get("/invoice/next-number");
};

// Fetch CRM clients for quick autofill
export const getClientsForInvoiceAPI = () => {
  return api.get("/invoice/clients");
};

// Generate and save invoice PDF
export const generateInvoiceAPI = (data) => {
  return api.post("/invoice/generate", data);
};

// Preview invoice PDF as a Blob
export const previewInvoiceBlobAPI = (data) => {
  return api.post("/invoice/preview", data, {
    responseType: "blob",
  });
};

// List all invoices
export const getAllInvoicesAPI = () => {
  return api.get("/invoice");
};

// Get single invoice by ID
export const getInvoiceByIdAPI = (id) => {
  return api.get(`/invoice/${id}`);
};

// Update and regenerate invoice PDF
export const updateInvoiceAPI = (id, data) => {
  return api.put(`/invoice/${id}`, data);
};

// Delete invoice
export const deleteInvoiceAPI = (id) => {
  return api.delete(`/invoice/${id}`);
};

