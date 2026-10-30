// Backend/Invoice/routes/Invoice.routes.js
import express from "express";
import {
  getNextInvoiceNumber,
  getClientsForInvoice,
  generateInvoice,
  previewInvoicePdf,
  listInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from "../controllers/Invoice.controller.js";
import {
  loginInvoice,
  getInvoiceAuthMe,
} from "../controllers/InvoiceAuth.controller.js";
import { protect } from "../../StaffCRM/middleware/auth.middleware.js";
import { roleCheck } from "../../StaffCRM/middleware/role.middleware.js";

const invoiceRoutes = express.Router();

/* ================= PUBLIC AUTH ROUTE ================= */
// Allows CRM Admin / HR to login using their CRM ID (email or phone) & password
invoiceRoutes.post("/auth/login", loginInvoice);

/* ================= PROTECTED & ROLE-RESTRICTED ROUTES ================= */
// All subsequent routes require valid JWT token AND role of Admin or HR
invoiceRoutes.use(protect);
invoiceRoutes.use(roleCheck("admin", "hr"));

// Session validation / current profile
invoiceRoutes.get("/auth/me", getInvoiceAuthMe);

// Invoice management endpoints
invoiceRoutes.get("/next-number", getNextInvoiceNumber);
invoiceRoutes.get("/clients", getClientsForInvoice);
invoiceRoutes.post("/generate", generateInvoice);
invoiceRoutes.post("/preview", previewInvoicePdf);
invoiceRoutes.get("/", listInvoices);
invoiceRoutes.get("/:id", getInvoiceById);
invoiceRoutes.put("/:id", updateInvoice);
invoiceRoutes.delete("/:id", deleteInvoice);

export default invoiceRoutes;
