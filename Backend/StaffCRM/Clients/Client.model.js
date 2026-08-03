import mongoose from "mongoose";

const credentialSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  username: String,
  password: String,
  note: String,
  addedAt: { type: Date, default: Date.now },
});

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    public_id: String,
    type: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: String,
    title: { type: String, required: true },
    url: { type: String, required: true },
    public_id: String,
    amount: Number,
    status: {
      type: String,
      enum: ["paid", "unpaid", "pending"],
      default: "unpaid",
    },
    issueDate: { type: Date, default: Date.now },
    dueDate: Date,
  },
  { _id: true },
);

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    min: 0,
  },
  date: { type: Date, default: Date.now },
  method: String,
  note: String,
});

const clientSchema = new mongoose.Schema(
  {
    profilePhoto: {
      url: String,
      public_id: String,
    },

    clientName: { type: String, required: true, trim: true },
    ownerName: String,
    email: { type: String, lowercase: true, trim: true },
    phone: String,
    address: String,

    services: [String],

    onboardingDate: {
      type: Date,
      default: Date.now,
    },

    // Client Portal Authentication
    password: { type: String, select: false },

    // Client Portal Details
    contentCalendarLink: String,
    driveFolderLink: String,
    planDetails: String,
    deliverables: [String],

    credentials: [credentialSchema],
    documents: [documentSchema],
    invoices: [invoiceSchema],
    transactions: [transactionSchema],
    notes: String,

    isActive: { type: Boolean, default: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Client", clientSchema);
