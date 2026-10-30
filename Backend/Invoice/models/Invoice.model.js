// Backend/Invoice/models/Invoice.model.js
import mongoose from "mongoose";

const InvoiceItemSchema = new mongoose.Schema(
  {
    srNo: { type: Number, default: 1 },
    service: { type: String, required: true },
    description: { type: String, default: "" },
    amount: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    sequenceNumber: { type: Number, default: 1001 },
    invoiceDate: { type: String, required: true },
    client: {
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
      name: { type: String, required: true },
      companyName: { type: String, default: "" },
      address: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      gstNumber: { type: String, default: "" },
      designation: { type: String, default: "Owner" },
    },
    items: [InvoiceItemSchema],
    gstEnabled: { type: Boolean, default: false },
    gstRate: { type: Number, default: 18 },
    cgstRate: { type: Number, default: 9 },
    sgstRate: { type: Number, default: 9 },
    subtotal: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    remainingDate: { type: String, default: "" },
    paymentTerms: {
      type: [String],
      default: [
        "Payment is due within 3 days of the invoice date.",
        "Services will be delivered as per the mutually agreed scope of work and timeline.",
        "Any additional work, features or revisions beyond the agreed scope will be charged separately.",
        "Delays in receiving required content, approvals or feedback from the client may affect delivery timelines.",
        "Advertising (ad spend) costs are not included in this invoice and will be billed separately, if applicable.",
        "Third-party resources, subscriptions, plugins, software or add-ons are not included and will be billed separately, if applicable.",
        "Delayed payments may result in a temporary pause or suspension of services.",
        "The agency is not responsible for delays or disruptions caused by third-party platforms or external service providers.",
        "Final deliverables and ownership rights will be transferred as per the agreed project terms and applicable payment conditions.",
        "Specific business results, sales, leads, rankings or engagement levels are not guaranteed unless explicitly agreed in writing.",
      ],
    },
    notes: { type: [String], default: [] },
    bankDetails: {
      bankName: { type: String, default: "Union Bank of India" },
      accountHolderName: {
        type: String,
        default: "Dheemahi Arkeshbhai Joshi",
      },
      accountNumber: { type: String, default: "534202010030024" },
      ifscCode: { type: String, default: "UBIN0553425" },
      upiId: { type: String, default: "dheemahi2@okhdfcbank" },
    },
    createdBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    pdfUrl: { type: String, default: "" },
    cloudinaryPublicId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["unpaid", "paid", "partial", "pending"],
      default: "unpaid",
    },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", InvoiceSchema);

