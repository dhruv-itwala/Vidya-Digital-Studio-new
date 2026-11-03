import Client from "./Client.model.js";
import Invoice from "../../Invoice/models/Invoice.model.js";
import { generateToken } from "../utils/jwt.util.js";
import bcrypt from "bcryptjs";
import AppError from "../utils/AppError.js";
import {
  encryptText,
  decryptCredentials,
} from "../utils/encryption.utils.js";

// Helper to normalize invoice status for Client Portal
const normalizeClientInvoiceStatus = (inv) => {
  const st = (inv.status || "").toLowerCase();
  const total = Number(inv.totalAmount) || Number(inv.amount) || 0;
  const advance = Number(inv.advanceAmount) || 0;
  const remaining = typeof inv.remainingAmount === "number" ? inv.remainingAmount : Math.max(0, total - advance);

  if (st === "paid" || st === "received" || remaining <= 0) {
    return "paid";
  }
  if (st === "partial" || st === "partial received" || st === "partially done" || (advance > 0 && remaining > 0)) {
    return "partially done";
  }
  return "pending";
};

// Studio Bank Details for Client Portal Payment Modal
const DEFAULT_STUDIO_BANK_DETAILS = {
  bankName: "Union Bank of India",
  accountHolderName: "Dheemahi Arkeshbhai Joshi",
  accountNumber: "534202010030024",
  ifscCode: "UBIN0553425",
  upiId: "dheemahi2@okhdfcbank",
};

// Public Brand Lookup for Dynamic Client Login
export const lookupClientBrand = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(200).json({
        success: true,
        found: false,
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const client = await Client.findOne({
      email: cleanEmail,
      isActive: true,
    })
      .select("clientName ownerName profilePhoto")
      .lean();

    if (!client) {
      return res.status(200).json({
        success: true,
        found: false,
      });
    }

    return res.status(200).json({
      success: true,
      found: true,
      data: {
        clientName: client.clientName,
        ownerName: client.ownerName,
        profilePhoto: client.profilePhoto,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Client Login
export const clientLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError("Please provide email and password", 400);
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const client = await Client.findOne({ email: cleanEmail }).select("+password");

    if (!client || !client.password) {
      throw new AppError("Invalid email or password", 401);
    }

    // Check password (supports bcrypt and auto-migrates legacy plaintext)
    let isMatch = false;
    if (
      client.password.startsWith("$2a$") ||
      client.password.startsWith("$2b$") ||
      client.password.startsWith("$2y$")
    ) {
      isMatch = await bcrypt.compare(password, client.password);
    } else {
      // Legacy plaintext password detected in DB
      if (client.password === password) {
        isMatch = true;
        // Upgrade/hash immediately in DB so plaintext is eliminated
        const salt = await bcrypt.genSalt(10);
        client.password = await bcrypt.hash(password, salt);
        await client.save();
      }
    }

    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!client.isActive) {
      throw new AppError("Client account is inactive", 403);
    }

    // Generate token with role 'client'
    const token = generateToken({ id: client._id, role: "client" });

    // Remove password from output
    client.password = undefined;

    // Decrypt credentials if returned
    if (client.credentials) {
      client.credentials = decryptCredentials(client.credentials);
    }

    res.status(200).json({
      status: "success",
      token,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

// Get Client Dashboard
export const getClientDashboard = async (req, res, next) => {
  try {
    const clientId = req.client.id || req.client._id;

    const client = await Client.findById(clientId).select("-password").lean();

    if (!client) {
      throw new AppError("Client not found", 404);
    }

    // Fetch all generated invoices from official Invoice collection
    const officialInvoices = await Invoice.find({
      $or: [
        { "client.clientId": clientId },
        { "client.email": client.email },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const formattedInvoices = officialInvoices.map((inv) => {
      const total = Number(inv.totalAmount) || 0;
      const advance = Number(inv.advanceAmount) || 0;
      const remaining = typeof inv.remainingAmount === "number" ? inv.remainingAmount : Math.max(0, total - advance);
      const normalizedStatus = normalizeClientInvoiceStatus(inv);

      return {
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        title: inv.items?.map((i) => i.service).join(", ").slice(0, 80) || "Creative Services",
        amount: total,
        totalAmount: total,
        advanceAmount: advance,
        remainingAmount: remaining,
        status: normalizedStatus,
        issueDate: inv.invoiceDate || inv.createdAt,
        dueDate: inv.remainingDate || inv.createdAt,
        url: inv.pdfUrl,
        downloadUrl: inv.pdfUrl && inv.pdfUrl.includes("/upload/")
          ? inv.pdfUrl.replace("/upload/", "/upload/fl_attachment/")
          : inv.pdfUrl,
        bankDetails: inv.bankDetails || DEFAULT_STUDIO_BANK_DETAILS,
      };
    });

    // If no official invoices but legacy embedded invoices exist, normalize those too
    if (formattedInvoices.length === 0 && client.invoices?.length > 0) {
      client.invoices.forEach((inv) => {
        formattedInvoices.push({
          _id: inv._id,
          invoiceNumber: inv.invoiceNumber || "INV-OLD",
          title: inv.title || "Creative Retainer",
          amount: inv.amount || 0,
          totalAmount: inv.amount || 0,
          advanceAmount: inv.status === "paid" ? (inv.amount || 0) : 0,
          remainingAmount: inv.status === "paid" ? 0 : (inv.amount || 0),
          status: normalizeClientInvoiceStatus(inv),
          issueDate: inv.issueDate || inv.createdAt,
          dueDate: inv.dueDate || inv.createdAt,
          url: inv.url,
          downloadUrl: inv.url,
          bankDetails: DEFAULT_STUDIO_BANK_DETAILS,
        });
      });
    }

    // Calculate current retainer billing cycle duration (1st of month to end of month)
    const now = new Date();
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const durationLabel = `${String(cycleStart.getDate()).padStart(2, "0")} ${monthNames[cycleStart.getMonth()]} ${cycleStart.getFullYear()} – ${String(cycleEnd.getDate()).padStart(2, "0")} ${monthNames[cycleEnd.getMonth()]} ${cycleEnd.getFullYear()}`;

    // Compute pending payment notification if any
    const pendingInvoice = formattedInvoices.find((i) => i.status !== "paid" && i.remainingAmount > 0);

    res.status(200).json({
      status: "success",
      data: {
        ...client,
        credentials: decryptCredentials(client.credentials || []),
        invoices: formattedInvoices,
        planDuration: {
          from: cycleStart,
          to: cycleEnd,
          label: durationLabel,
        },
        pendingPaymentNotification: pendingInvoice ? {
          invoiceId: pendingInvoice._id,
          invoiceNumber: pendingInvoice.invoiceNumber,
          remainingAmount: pendingInvoice.remainingAmount,
          dueDate: pendingInvoice.dueDate,
        } : null,
        bankDetails: DEFAULT_STUDIO_BANK_DETAILS,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Client Invoices (Dedicated)
export const getClientInvoices = async (req, res, next) => {
  try {
    const clientId = req.client.id || req.client._id;
    const client = await Client.findById(clientId).select("email invoices").lean();

    if (!client) {
      throw new AppError("Client not found", 404);
    }

    const officialInvoices = await Invoice.find({
      $or: [
        { "client.clientId": clientId },
        { "client.email": client.email },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const formattedInvoices = officialInvoices.map((inv) => {
      const total = Number(inv.totalAmount) || 0;
      const advance = Number(inv.advanceAmount) || 0;
      const remaining = typeof inv.remainingAmount === "number" ? inv.remainingAmount : Math.max(0, total - advance);

      return {
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        title: inv.items?.map((i) => i.service).join(", ").slice(0, 80) || "Creative Services",
        amount: total,
        totalAmount: total,
        advanceAmount: advance,
        remainingAmount: remaining,
        status: normalizeClientInvoiceStatus(inv),
        issueDate: inv.invoiceDate || inv.createdAt,
        dueDate: inv.remainingDate || inv.createdAt,
        url: inv.pdfUrl,
        downloadUrl: inv.pdfUrl && inv.pdfUrl.includes("/upload/")
          ? inv.pdfUrl.replace("/upload/", "/upload/fl_attachment/")
          : inv.pdfUrl,
        bankDetails: inv.bankDetails || DEFAULT_STUDIO_BANK_DETAILS,
      };
    });

    if (formattedInvoices.length === 0 && client.invoices?.length > 0) {
      client.invoices.forEach((inv) => {
        formattedInvoices.push({
          _id: inv._id,
          invoiceNumber: inv.invoiceNumber || "INV-OLD",
          title: inv.title || "Creative Retainer",
          amount: inv.amount || 0,
          totalAmount: inv.amount || 0,
          advanceAmount: inv.status === "paid" ? (inv.amount || 0) : 0,
          remainingAmount: inv.status === "paid" ? 0 : (inv.amount || 0),
          status: normalizeClientInvoiceStatus(inv),
          issueDate: inv.issueDate || inv.createdAt,
          dueDate: inv.dueDate || inv.createdAt,
          url: inv.url,
          downloadUrl: inv.url,
          bankDetails: DEFAULT_STUDIO_BANK_DETAILS,
        });
      });
    }

    res.status(200).json({
      status: "success",
      data: formattedInvoices,
    });
  } catch (error) {
    next(error);
  }
};

// Get Client Credentials
export const getClientCredentials = async (req, res, next) => {
  try {
    const clientId = req.client.id || req.client._id;

    const client = await Client.findById(clientId).select("+credentials -password").lean();

    if (!client) {
      throw new AppError("Client not found", 404);
    }

    res.status(200).json({
      status: "success",
      success: true,
      data: decryptCredentials(client.credentials || []),
    });
  } catch (error) {
    next(error);
  }
};

// Add Client Credential from Client Portal
export const addClientCredential = async (req, res, next) => {
  try {
    const clientId = req.client.id || req.client._id;
    const { platform, username, password, note } = req.body;

    if (!platform || !username) {
      throw new AppError("Platform and username are required", 400);
    }

    // Encrypt platform password before storing in database
    const newCred = {
      platform: platform.trim(),
      username: username.trim(),
      password: encryptText(password || ""),
      note: note || "",
      addedAt: new Date(),
    };

    const client = await Client.findByIdAndUpdate(
      clientId,
      { $push: { credentials: newCred } },
      { new: true, runValidators: true }
    ).select("-password").lean();

    if (!client) {
      throw new AppError("Client not found", 404);
    }

    res.status(201).json({
      status: "success",
      success: true,
      message: "Platform login added successfully",
      data: decryptCredentials(client.credentials || []),
    });
  } catch (error) {
    next(error);
  }
};

// Delete Client Credential from Client Portal
export const deleteClientCredential = async (req, res, next) => {
  try {
    const clientId = req.client.id || req.client._id;
    const { credId } = req.params;

    const client = await Client.findByIdAndUpdate(
      clientId,
      { $pull: { credentials: { _id: credId } } },
      { new: true }
    ).select("-password").lean();

    if (!client) {
      throw new AppError("Client not found", 404);
    }

    res.status(200).json({
      status: "success",
      success: true,
      message: "Platform login deleted successfully",
      data: decryptCredentials(client.credentials || []),
    });
  } catch (error) {
    next(error);
  }
};
