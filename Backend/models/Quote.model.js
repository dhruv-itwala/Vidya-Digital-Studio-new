// models/Quote.model.js
import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    category: String,
    service: String,
    description: String,
    quantity: { type: Number, default: 1 },
    total: { type: Number, default: 0 },
    option: String,
  },
  { _id: false }
);

const QuoteSchema = new mongoose.Schema(
  {
    client: {
      name: String,
      email: String,
      designation: String,
      address: String,
      contact: String,
    },
    items: [ItemSchema],
    duration: String,
    notes: [String],
    subtotal: { type: Number, default: 0 },
    pdfUrl: String,
    cloudinaryPublicId: String,
    expiresAt: Date,
    isAdmin: { type: Boolean, default: false }, // New field
    isApproved: { type: Boolean, default: false }, // New field
    emailSent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Quote", QuoteSchema);
