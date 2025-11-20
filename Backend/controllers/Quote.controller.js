// controllers/quote.controller.js
import Quote from "../models/Quote.model.js";
import { generateQuotePdfBuffer } from "../services/Pdf.service.js";
import { uploadBufferToCloudinary } from "../services/Cloudinary.service.js";
import { sendEmailTemplate } from "../services/Email.service.js";

export const createQuote = async (req, res) => {
  try {
    const {
      client = {},
      items = [],
      notes = [],
      duration = "",
      isAdmin, // Extracting isAdmin
      isApproved, // Extracting isApproved
    } = req.body;

    const isAdminBool =
      isAdmin === true ||
      isAdmin === "true" ||
      isAdmin === 1 ||
      isAdmin === "1";

    const isApprovedBool =
      isApproved === true ||
      isApproved === "true" ||
      isApproved === 1 ||
      isApproved === "1";

    if (!client.name || !client.email) {
      return res.status(400).json({
        success: false,
        message: "client.name and client.email required",
      });
    }

    const logoUrl =
      process.env.EMAIL_LOGO ||
      "https://res.cloudinary.com/dmt7dysjh/image/upload/v1763372867/ft5zwscplj5kjthohc1y.png";

    // Generate PDF
    const pdfBuffer = await generateQuotePdfBuffer({
      client,
      items,
      notes,
      duration,
      isAdmin: isAdminBool,
      isApproved: isApprovedBool,
    });

    // Upload PDF to Cloudinary
    const filenameBase = `${client.name.replace(/\s+/g, "_")}_${Date.now()}`;
    const upload = await uploadBufferToCloudinary(pdfBuffer, filenameBase);

    const subtotal = items.reduce((sum, i) => sum + Number(i.total || 0), 0);

    // Create the quote
    const quote = await Quote.create({
      client,
      items,
      notes,
      subtotal,
      duration,
      isAdmin: isAdminBool,
      isApproved: isApprovedBool,
      pdfUrl: upload.url,
      cloudinaryPublicId: upload.public_id,
      expiresAt: upload.expires_at,
      emailSent: false,
    });

    // Send email
    try {
      await sendEmailTemplate({
        to: client.email,
        subject: `Quotation from Vidya Digital Studio`,
        templateName: "quoteEmailTemplate",
        data: {
          client,
          pdfUrl: upload.url,
          expireDays: process.env.PDF_EXPIRE_DAYS || 7,
          notes,
          subtotal,
          logoUrl,
        },
      });

      quote.emailSent = true;
      await quote.save();
    } catch (err) {
      console.warn("Email sending failed:", err.message);
    }

    return res.json({
      success: true,
      pdfUrl: upload.url,
      quoteId: quote._id,
      isAdmin: quote.isAdmin,
      isApproved: quote.isApproved,
      expiresAt: upload.expires_at,
      emailSent: quote.emailSent,
    });
  } catch (err) {
    console.error("createQuote error", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const quote = await Quote.findById(id).lean();
    if (!quote)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: quote });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: quotes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const q = await Quote.findById(id);
    if (!q)
      return res.status(404).json({ success: false, message: "not found" });

    // optionally delete cloudinary file
    if (q.cloudinaryPublicId) {
      try {
        const cloudinary = (await import("../config/cloudinary.config.js"))
          .default;
        await cloudinary.uploader.destroy(q.cloudinaryPublicId, {
          resource_type: "raw",
        });
      } catch (e) {
        console.warn("Cloudinary delete error:", e.message);
      }
    }

    await q.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const testPdf = async (req, res) => {
  try {
    const {
      client = {},
      items = [],
      notes = [],
      duration = "",
      isAdmin,
    } = req.body;

    // Minimal validation
    if (!client.name) client.name = "Test Client";
    if (!client.email) client.email = "test@example.com";

    // Generate the PDF buffer (NO upload, NO email)
    const pdfBuffer = await generateQuotePdfBuffer({
      client,
      items,
      notes,
      duration,
      isAdmin,
    });

    // Send as file download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="test-quotation.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF test error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
