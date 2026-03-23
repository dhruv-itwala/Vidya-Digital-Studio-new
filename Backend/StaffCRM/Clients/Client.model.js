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
    credentials: [credentialSchema],
    documents: [documentSchema],
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
