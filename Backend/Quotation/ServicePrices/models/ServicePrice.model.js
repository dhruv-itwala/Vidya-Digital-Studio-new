// models/ServicePrice.model.js
import mongoose from "mongoose";

const ServicePriceSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    description: String,

    // mixed pricing model
    priceType: {
      type: String,
      enum: [
        "perScript",
        "perPage",
        "perWord",
        "perReel",
        "perVideo",
        "perMinute",
        "perSecond",
        "fixed",
        "range",
        "multiOption",
        "custom",
        "monthly",
        "perPlatform",
        "perAd",
        "perBanner",
        "startingFrom",
        "variable",
      ],
      required: true,
    },

    price: Number,
    unit: String,

    priceRange: {
      type: [Number],
      default: undefined,
    },

    options: {
      type: Object,
      default: undefined,
    },

    priceNote: String,
    notes: String,
  },
  { timestamps: true }
);

// Bind to your database + collection
export default mongoose.model(
  "ServicePrice",
  ServicePriceSchema,
  "service_prices"
);
