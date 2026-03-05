import mongoose from "mongoose";

const meetingNoteSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    note: { type: String, required: true },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false },
);

const leadSchema = new mongoose.Schema(
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
    notes: String,

    services: [String],

    meetingNotes: [meetingNoteSchema],

    status: {
      type: String,
      enum: [
        "Raw Lead",
        "First Contact Attempt",
        "Lead Qualification",
        "Appointment / Meeting Schedule",
        "Presentation / Demo / Consultation",
        "Proposal Send",
        "Negotiation",
        "Verbal Confirmation",
        "Client Won",
        "Closed Loss",
        "Transferred",
      ],
      default: "Raw Lead",
    },

    isConverted: {
      type: Boolean,
      default: false,
    },

    convertedAt: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Lead", leadSchema);
