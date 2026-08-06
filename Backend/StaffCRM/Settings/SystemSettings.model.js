import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema(
  {
    notifications: {
      reminders: {
        punchIn: { type: Boolean, default: true },
        punchOut: { type: Boolean, default: true },
        breakIn: { type: Boolean, default: true },
        breakOut: { type: Boolean, default: true },
        breakAboutToOver: { type: Boolean, default: true },
        report: { type: Boolean, default: true },
        tasks: { type: Boolean, default: true }, // Added just in case
      },
      info: {
        noticeboard: { type: Boolean, default: true },
        birthdays: { type: Boolean, default: true },
      },
      hr: {
        leaveApplied: { type: Boolean, default: true },
        leaveStatusChanged: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("SystemSettings", systemSettingsSchema);
