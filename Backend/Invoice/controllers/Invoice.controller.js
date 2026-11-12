// Backend/Invoice/controllers/Invoice.controller.js
import Invoice from "../models/Invoice.model.js";
import Client from "../../StaffCRM/Clients/Client.model.js";
import CashAccount from "../../Finance/models/CashAccount.model.js";
import CashTransaction from "../../Finance/models/CashTransaction.model.js";
import { generateInvoicePdfBuffer } from "../services/Pdf.service.js";
import { uploadBufferToCloudinary, deleteByPublicId } from "../../Quotation/Quote/services/Cloudinary.service.js";

/* ================= GET NEXT INVOICE NUMBER ================= */
export const getNextInvoiceNumber = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const latestInvoice = await Invoice.findOne({
      invoiceNumber: new RegExp(`IND/${currentYear}`),
    })
      .sort({ sequenceNumber: -1, createdAt: -1 })
      .lean();

    let nextSeq = 1001;
    if (latestInvoice && latestInvoice.sequenceNumber) {
      nextSeq = latestInvoice.sequenceNumber + 1;
    } else {
      // Also check if any existing invoice has a sequence or number like #1001
      const count = await Invoice.countDocuments();
      if (count > 0) {
        nextSeq = 1001 + count;
      }
    }

    const nextInvoiceNumber = `IND/${currentYear} : #${nextSeq}`;
    return res.status(200).json({
      success: true,
      nextInvoiceNumber,
      sequenceNumber: nextSeq,
    });
  } catch (error) {
    console.error("[Invoice] Error getting next invoice number:", error);
    const fallbackYear = new Date().getFullYear();
    return res.status(200).json({
      success: true,
      nextInvoiceNumber: `IND/${fallbackYear} : #1001`,
      sequenceNumber: 1001,
    });
  }
};

/* ================= GET CLIENTS FOR INVOICE ================= */
export const getClientsForInvoice = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true })
      .select("clientName ownerName email phone address")
      .sort({ clientName: 1, createdAt: -1 })
      .lean();

    const formatted = clients.map((c) => ({
      _id: c._id,
      companyName: c.clientName || "",
      name: c.ownerName || c.clientName || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error("[Invoice] Error fetching clients:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch clients",
      error: error.message,
    });
  }
};

/* ================= GENERATE INVOICE ================= */
export const generateInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      sequenceNumber,
      invoiceDate,
      invoiceType = "regular",
      amountToBePaid,
      parentInvoiceId,
      parentInvoiceNumber,
      client = {},
      items = [],
      gstEnabled = false,
      subtotal: rawSubtotal,
      cgst: rawCgst,
      sgst: rawSgst,
      totalAmount: rawTotalAmount,
      advanceAmount: rawAdvanceAmount = 0,
      remainingAmount: rawRemainingAmount,
      remainingDate = "",
      paymentTerms = [],
      notes = [],
      bankDetails = {},
    } = req.body;

    if (!client.name && !client.companyName) {
      return res.status(400).json({
        success: false,
        message: "Client name or company name is required",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one service item is required",
      });
    }

    // Number conversions and calculations
    const calcSubtotal =
      rawSubtotal !== undefined
        ? Number(rawSubtotal)
        : items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    const isGst = !!gstEnabled;
    const calcCgst = isGst
      ? rawCgst !== undefined
        ? Number(rawCgst)
        : Math.round(calcSubtotal * 0.09)
      : 0;

    const calcSgst = isGst
      ? rawSgst !== undefined
        ? Number(rawSgst)
        : Math.round(calcSubtotal * 0.09)
      : 0;

    const calcTotalAmount =
      rawTotalAmount !== undefined
        ? Number(rawTotalAmount)
        : isGst
        ? calcSubtotal + calcCgst + calcSgst
        : calcSubtotal;

    const advanceAmount = Number(rawAdvanceAmount) || 0;

    let finalInvoiceType = invoiceType || "regular";
    if (finalInvoiceType === "regular" && advanceAmount > 0 && advanceAmount < calcTotalAmount) {
      finalInvoiceType = "advance";
    }

    let calcRemainingAmount = 0;
    let calcAmountToBePaid = 0;

    if (finalInvoiceType === "advance") {
      calcAmountToBePaid = advanceAmount > 0 ? advanceAmount : calcTotalAmount;
      calcRemainingAmount = Math.max(0, calcTotalAmount - advanceAmount);
    } else if (finalInvoiceType === "remaining") {
      calcAmountToBePaid =
        rawRemainingAmount !== undefined
          ? Number(rawRemainingAmount)
          : Math.max(0, calcTotalAmount - advanceAmount);
      calcRemainingAmount = 0;
    } else {
      calcAmountToBePaid = calcTotalAmount;
      calcRemainingAmount = 0;
    }

    if (typeof amountToBePaid === "number" && amountToBePaid > 0) {
      calcAmountToBePaid = Number(amountToBePaid);
    }

    const formattedInvoiceNumber =
      invoiceNumber || `IND/${new Date().getFullYear()} : #1001`;

    const formattedInvoiceDate =
      invoiceDate ||
      new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).toUpperCase();

    // Generate PDF Buffer
    const pdfBuffer = await generateInvoicePdfBuffer({
      invoiceNumber: formattedInvoiceNumber,
      invoiceDate: formattedInvoiceDate,
      invoiceType: finalInvoiceType,
      amountToBePaid: calcAmountToBePaid,
      client,
      items,
      gstEnabled: isGst,
      subtotal: calcSubtotal,
      cgst: calcCgst,
      sgst: calcSgst,
      totalAmount: calcTotalAmount,
      advanceAmount,
      remainingAmount: calcRemainingAmount,
      remainingDate,
      paymentTerms,
      notes,
      bankDetails,
      status: "unpaid",
    });

    // Cloudinary Upload
    let pdfUrl = "";
    let cloudinaryPublicId = "";
    try {
      const sanitizedName = (client.companyName || client.name || "Invoice")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .slice(0, 30);
      const filenameBase = `Invoice_${sanitizedName}_${Date.now()}`;
      const uploadResult = await uploadBufferToCloudinary(
        pdfBuffer,
        filenameBase
      );
      pdfUrl = uploadResult.url; // Use clean inline viewing URL (no fl_attachment)
      cloudinaryPublicId = uploadResult.public_id;
    } catch (uploadErr) {
      console.warn("[Invoice] Cloudinary upload warning:", uploadErr.message);
      // Fallback: provide direct data URI for download
      pdfUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
    }

    // Determine sequence
    let seq = Number(sequenceNumber);
    if (!seq || isNaN(seq)) {
      const match = formattedInvoiceNumber.match(/#(\d+)/);
      seq = match ? parseInt(match[1], 10) : 1001;
    }

    // Save to Database
    const newInvoice = await Invoice.findOneAndUpdate(
      { invoiceNumber: formattedInvoiceNumber },
      {
        invoiceNumber: formattedInvoiceNumber,
        sequenceNumber: seq,
        invoiceDate: formattedInvoiceDate,
        client,
        items,
        gstEnabled: isGst,
        gstRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        subtotal: calcSubtotal,
        cgst: calcCgst,
        sgst: calcSgst,
        totalAmount: calcTotalAmount,
        invoiceType: finalInvoiceType,
        amountToBePaid: calcAmountToBePaid,
        parentInvoiceId: parentInvoiceId || undefined,
        parentInvoiceNumber: parentInvoiceNumber || "",
        advanceAmount,
        remainingAmount: calcRemainingAmount,
        remainingDate,
        paymentTerms,
        notes,
        bankDetails,
        createdBy: req.user
          ? {
              userId: req.user._id,
              name: req.user.name,
              email: req.user.email,
              role: req.user.role,
            }
          : undefined,
        pdfUrl,
        cloudinaryPublicId,
        status: "unpaid",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // If client has CRM ID, update Client record
    if (client.clientId) {
      try {
        await Client.findByIdAndUpdate(client.clientId, {
          $push: {
            invoices: {
              invoiceNumber: formattedInvoiceNumber,
              title: items.map((i) => i.service).join(", ").slice(0, 80),
              url: pdfUrl,
              public_id: cloudinaryPublicId,
              amount: calcTotalAmount,
              status: advanceAmount >= calcTotalAmount ? "paid" : "unpaid",
              issueDate: new Date(),
            },
          },
        });
      } catch (clientUpdateErr) {
        console.warn("[Invoice] Client document link warning:", clientUpdateErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Invoice generated successfully",
      data: newInvoice,
      pdfUrl,
      downloadUrl: pdfUrl.includes("/upload/")
        ? pdfUrl.replace("/upload/", "/upload/fl_attachment/")
        : pdfUrl,
      pdfBase64: pdfBuffer.toString("base64"),
    });
  } catch (error) {
    console.error("[Invoice] Generation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate invoice",
      error: error.message,
    });
  }
};

/* ================= PREVIEW DIRECT STREAM ================= */
export const previewInvoicePdf = async (req, res) => {
  try {
    const pdfBuffer = await generateInvoicePdfBuffer(req.body);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Invoice_${Date.now()}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("[Invoice] Preview Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to render PDF preview",
      error: error.message,
    });
  }
};

/* ================= LIST INVOICES ================= */
export const listInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Invoice.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: invoices,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[Invoice] List error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to list invoices",
      error: error.message,
    });
  }
};

/* ================= GET INVOICE BY ID ================= */
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }
    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
      error: error.message,
    });
  }
};

/* ================= UPDATE & REGENERATE INVOICE ================= */
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const {
      invoiceNumber = invoice.invoiceNumber,
      invoiceDate = invoice.invoiceDate,
      invoiceType = invoice.invoiceType || "regular",
      amountToBePaid,
      client = invoice.client,
      items = invoice.items,
      gstEnabled = invoice.gstEnabled,
      advanceAmount = invoice.advanceAmount,
      remainingDate = invoice.remainingDate,
      paymentTerms = invoice.paymentTerms,
      notes = invoice.notes,
      bankDetails = invoice.bankDetails,
    } = req.body;

    // Recalculate financial breakdown
    const isGst = Boolean(gstEnabled);
    const calcSubtotal = items.reduce(
      (acc, curr) => acc + (Number(curr.amount) || 0),
      0
    );
    const calcCgst = isGst ? Math.round(calcSubtotal * 0.09) : 0;
    const calcSgst = isGst ? Math.round(calcSubtotal * 0.09) : 0;
    const calcTotalAmount = calcSubtotal + calcCgst + calcSgst;
    const numAdvance = Number(advanceAmount) || 0;

    let finalInvoiceType = invoiceType;
    if (finalInvoiceType === "regular" && numAdvance > 0 && numAdvance < calcTotalAmount) {
      finalInvoiceType = "advance";
    }

    let calcRemainingAmount = 0;
    let calcAmountToBePaid = 0;

    if (finalInvoiceType === "advance") {
      calcAmountToBePaid = numAdvance > 0 ? numAdvance : calcTotalAmount;
      calcRemainingAmount = Math.max(0, calcTotalAmount - numAdvance);
    } else if (finalInvoiceType === "remaining") {
      calcAmountToBePaid = Math.max(0, calcTotalAmount - numAdvance);
      calcRemainingAmount = 0;
    } else {
      calcAmountToBePaid = calcTotalAmount;
      calcRemainingAmount = 0;
    }

    if (typeof amountToBePaid === "number" && amountToBePaid > 0) {
      calcAmountToBePaid = Number(amountToBePaid);
    }

    // Regenerate PDF Buffer
    const pdfBuffer = await generateInvoicePdfBuffer({
      invoiceNumber,
      invoiceDate,
      invoiceType: finalInvoiceType,
      amountToBePaid: calcAmountToBePaid,
      client,
      items,
      gstEnabled: isGst,
      subtotal: calcSubtotal,
      cgst: calcCgst,
      sgst: calcSgst,
      totalAmount: calcTotalAmount,
      advanceAmount: numAdvance,
      remainingAmount: calcRemainingAmount,
      remainingDate,
      paymentTerms,
      notes,
      bankDetails,
      status: invoice.status || "unpaid",
    });

    // Upload updated PDF to Cloudinary & delete old file
    let pdfUrl = invoice.pdfUrl;
    const oldCloudinaryPublicId = invoice.cloudinaryPublicId;
    let cloudinaryPublicId = invoice.cloudinaryPublicId;
    try {
      const sanitizedName = (client.companyName || client.name || "Invoice")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .slice(0, 30);
      const filenameBase = `Invoice_${sanitizedName}_${Date.now()}`;
      const uploadResult = await uploadBufferToCloudinary(
        pdfBuffer,
        filenameBase
      );
      pdfUrl = uploadResult.url;
      cloudinaryPublicId = uploadResult.public_id;

      // Delete old invoice PDF from Cloudinary
      if (oldCloudinaryPublicId && oldCloudinaryPublicId !== cloudinaryPublicId) {
        try {
          await deleteByPublicId(oldCloudinaryPublicId);
        } catch (delErr) {
          console.warn("[Invoice] Old Cloudinary file deletion failed on update:", delErr.message);
        }
      }
    } catch (uploadErr) {
      console.warn("[Invoice] Cloudinary upload warning on update:", uploadErr.message);
      pdfUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
    }

    // Update document
    invoice.invoiceNumber = invoiceNumber;
    invoice.invoiceDate = invoiceDate;
    invoice.client = client;
    invoice.items = items;
    invoice.gstEnabled = isGst;
    invoice.subtotal = calcSubtotal;
    invoice.cgst = calcCgst;
    invoice.sgst = calcSgst;
    invoice.totalAmount = calcTotalAmount;
    invoice.invoiceType = finalInvoiceType;
    invoice.amountToBePaid = calcAmountToBePaid;
    invoice.advanceAmount = numAdvance;
    invoice.remainingAmount = calcRemainingAmount;
    invoice.remainingDate = remainingDate;
    invoice.paymentTerms = paymentTerms;
    invoice.notes = notes;
    invoice.bankDetails = bankDetails;
    invoice.pdfUrl = pdfUrl;
    invoice.cloudinaryPublicId = cloudinaryPublicId;
    if (!invoice.status) {
      invoice.status = "unpaid";
    }

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Invoice updated & regenerated successfully",
      data: invoice,
      pdfUrl,
      downloadUrl: pdfUrl.includes("/upload/")
        ? pdfUrl.replace("/upload/", "/upload/fl_attachment/")
        : pdfUrl,
      pdfBase64: pdfBuffer.toString("base64"),
    });
  } catch (error) {
    console.error("[Invoice] Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update invoice",
      error: error.message,
    });
  }
};

/* ================= DELETE INVOICE ================= */
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (invoice.cloudinaryPublicId) {
      try {
        await deleteByPublicId(invoice.cloudinaryPublicId);
      } catch (delErr) {
        console.warn("[Invoice] Cloudinary file deletion failed on deleteInvoice:", delErr.message);
      }
    }

    // Also remove from linked Client document embedded invoices if present
    if (invoice.client?.clientId) {
      await Client.findByIdAndUpdate(invoice.client.clientId, {
        $pull: { invoices: { invoiceNumber: invoice.invoiceNumber } },
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete invoice",
      error: error.message,
    });
  }
};

/* ================= UPDATE INVOICE STATUS (RECEIVED / PARTIAL / PENDING) ================= */
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, receivedAmount, cashAccountId, notes } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    const validStatuses = [
      "received",
      "paid",
      "partial received",
      "partial",
      "pending",
      "unpaid",
    ];
    const normalizedStatus = (status || "").toLowerCase().trim();

    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed: 'received', 'partial received', 'pending'",
      });
    }

    let deltaReceived = 0;
    const invoiceBillAmount =
      invoice.amountToBePaid ||
      (invoice.invoiceType === "advance"
        ? invoice.advanceAmount || invoice.totalAmount
        : invoice.invoiceType === "remaining"
        ? invoice.remainingAmount || Math.max(0, invoice.totalAmount - (invoice.advanceAmount || 0))
        : invoice.totalAmount);

    if (normalizedStatus === "received" || normalizedStatus === "paid") {
      deltaReceived = receivedAmount && Number(receivedAmount) > 0 ? Number(receivedAmount) : invoiceBillAmount;
      invoice.status = "paid";
    } else if (normalizedStatus === "partial received" || normalizedStatus === "partial") {
      const added = Number(receivedAmount);
      if (isNaN(added) || added <= 0) {
        return res.status(400).json({
          success: false,
          message: "Please specify a valid received amount for partial payment.",
        });
      }
      deltaReceived = added;
      invoice.status = added >= invoiceBillAmount ? "paid" : "partial";
    } else if (normalizedStatus === "pending" || normalizedStatus === "unpaid") {
      invoice.status = "unpaid";
    }

    // Regenerate PDF with updated advance & remaining amounts & dynamic amount QR code
    try {
      const pdfBuffer = await generateInvoicePdfBuffer({
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        invoiceType: invoice.invoiceType,
        amountToBePaid: invoice.status === "paid" ? 0 : invoice.amountToBePaid,
        client: invoice.client,
        items: invoice.items,
        gstEnabled: invoice.gstEnabled,
        subtotal: invoice.subtotal,
        cgst: invoice.cgst,
        sgst: invoice.sgst,
        totalAmount: invoice.totalAmount,
        advanceAmount: invoice.advanceAmount,
        remainingAmount: invoice.remainingAmount,
        remainingDate: invoice.remainingDate,
        paymentTerms: invoice.paymentTerms,
        notes: invoice.notes,
        bankDetails: invoice.bankDetails,
        status: invoice.status,
      });

      const sanitizedName = (invoice.client?.companyName || invoice.client?.name || "Invoice")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .slice(0, 30);
      const filenameBase = `Invoice_${sanitizedName}_${Date.now()}`;
      const uploadResult = await uploadBufferToCloudinary(pdfBuffer, filenameBase);

      const oldCloudinaryPublicId = invoice.cloudinaryPublicId;
      invoice.pdfUrl = uploadResult.url;
      invoice.cloudinaryPublicId = uploadResult.public_id;

      if (oldCloudinaryPublicId && oldCloudinaryPublicId !== uploadResult.public_id) {
        try {
          await deleteByPublicId(oldCloudinaryPublicId);
        } catch (delErr) {
          console.warn("[Invoice] Old Cloudinary file deletion failed on status update:", delErr.message);
        }
      }
    } catch (pdfErr) {
      console.warn("[Invoice] PDF regeneration warning on status update:", pdfErr.message);
    }

    await invoice.save();

    // Also update embedded invoice in Client document if linked
    if (invoice.client?.clientId) {
      await Client.findOneAndUpdate(
        { _id: invoice.client.clientId, "invoices.invoiceNumber": invoice.invoiceNumber },
        {
          $set: {
            "invoices.$.status": invoice.status,
            "invoices.$.url": invoice.pdfUrl,
            "invoices.$.public_id": invoice.cloudinaryPublicId,
          },
        }
      ).catch(() => {});
    }

    // If cashAccountId provided and money was collected, credit account and log transaction
    if (cashAccountId && deltaReceived > 0) {
      try {
        const cashAcc = await CashAccount.findById(cashAccountId);
        if (cashAcc) {
          cashAcc.currentBalance += deltaReceived;
          await cashAcc.save();

          await CashTransaction.create({
            cashAccountId: cashAcc._id,
            type: "INCOME",
            amount: deltaReceived,
            balanceAfter: cashAcc.currentBalance,
            category: "Client Invoice",
            referenceId: invoice._id,
            referenceModel: "Invoice",
            description: `Payment received for ${invoice.invoiceNumber} (${invoice.client?.companyName || invoice.client?.name}): ${notes || "Invoice payment"}`,
            performedBy: req.user?._id || req.user?.id,
          });
        }
      } catch (accErr) {
        console.warn("[Invoice] Cash account credit warning:", accErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Invoice marked as ${invoice.status}`,
      data: invoice,
      pdfUrl: invoice.pdfUrl,
      downloadUrl: invoice.pdfUrl && invoice.pdfUrl.includes("/upload/")
        ? invoice.pdfUrl.replace("/upload/", "/upload/fl_attachment/")
        : invoice.pdfUrl,
    });
  } catch (error) {
    console.error("[Invoice] Update Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update invoice status",
      error: error.message,
    });
  }
};

