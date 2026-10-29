// Backend/StaffCRM/Attendance/officeNetwork.model.js
import mongoose from "mongoose";

const officeNetworkSchema = new mongoose.Schema(
  {
    networkLabel: {
      type: String,
      default: "Vidya Digital Studio Main Wi-Fi",
      trim: true,
    },
    officePublicIps: {
      type: [String],
      default: [],
    },
    localSubnet: {
      type: String,
      default: "192.168.0.",
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedByName: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("OfficeNetwork", officeNetworkSchema);

