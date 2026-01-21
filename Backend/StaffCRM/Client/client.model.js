import mongoose from "mongoose";

/* =========================
   SUB SCHEMAS
========================= */

// Payment history
const transactionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

// Documents
const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

// Credentials
const credentialSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true, // ig, fb, google etc
    },
    username: String,
    password: String,
    note: String,
  },
  { _id: false },
);

/* =========================
   MAIN CLIENT SCHEMA
========================= */

const clientSchema = new mongoose.Schema(
  {
    /* ===== BASIC INFO ===== */
    profilePhoto: {
      type: String, // cloudinary url
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },

    /* ===== PACKAGE INFO ===== */
    services: [
      {
        type: String,
      },
    ],
    onboardingDate: {
      type: Date,
      default: Date.now,
    },
    billingType: {
      type: String,
      enum: ["one-time", "monthly"],
      required: true,
    },

    // One-time
    totalAmount: {
      type: Number,
    },

    // Monthly
    monthlyAmount: {
      type: Number,
    },
    tenure: {
      type: Number, // in months
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },

    /* ===== PAYMENT DETAILS ===== */
    transactions: [transactionSchema],

    /* ===== DOCUMENTS ===== */
    documents: [documentSchema],

    /* ===== CREDENTIALS ===== */
    credentials: [credentialSchema],

    // add inside main schema
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
    },

    // Monthly helper
    paidMonths: {
      type: Number,
      default: 0,
    },

    /* ===== META ===== */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Client", clientSchema);
