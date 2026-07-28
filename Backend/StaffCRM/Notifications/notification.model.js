import mongoose from "mongoose";

const notificationSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    endpoint: {
      type: String,
      required: true,
    },

    keys: {
      p256dh: {
        type: String,
        required: true,
      },

      auth: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

notificationSubscriptionSchema.index(
  {
    user: 1,
    endpoint: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model(
  "NotificationSubscription",
  notificationSubscriptionSchema,
);
