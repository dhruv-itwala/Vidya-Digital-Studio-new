import mongoose from "mongoose";

const handleSchema = new mongoose.Schema({
  platform: { type: String, required: true }, // instagram, facebook, email, custom
  username: String,
  password: String,
  email: String,
  phone: String,
});

const clientSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    ownerName: String,
    email: String,

    services: [String],

    payment: {
      amount: { type: Number, required: true },
      tenure: {
        type: String, // in months
        default: 1,
      },
      status: {
        type: String,
        enum: ["pending", "paid", "partial"],
        default: "pending",
      },
      method: String,
    },

    onboardingDate: Date,

    credentials: [handleSchema],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);
