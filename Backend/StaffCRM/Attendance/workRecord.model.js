import mongoose from "mongoose";

const breakSchema = new mongoose.Schema(
  {
    in: Date,
    out: Date,
  },
  { _id: false },
);

const workRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date, // IST normalized date stored in UTC
      required: true,
    },

    /* ======================
       PUNCH
    ====================== */

    punchIn: Date,
    punchOut: Date,

    /* ======================
       BREAKS
    ====================== */

    breaks: [breakSchema],

    /* ======================
       WORK CALCULATION
    ====================== */

    totalWorkMinutes: { type: Number, default: 0 },
    totalBreakMinutes: { type: Number, default: 0 },
    netWorkMinutes: { type: Number, default: 0 },

    overtimeMinutes: { type: Number, default: 0 },
    lateMinutes: { type: Number, default: 0 },

    /* ======================
       STATUS
    ====================== */

    attendanceStatus: {
      type: String,
      enum: [
        "PRESENT",
        "HALF_DAY",
        "ABSENT",
        "WFH",
        "HOLIDAY",
        "LEAVE",
        "INCOMPLETE",
      ],
    },

    reportSubmitted: {
      type: Boolean,
      default: false,
    },

    autoClosed: {
      type: Boolean,
      default: false,
    },

    /* ======================
       REMINDER FLAGS
    ====================== */

    punchInReminderSent: { type: Boolean, default: false },

    breakReminderSent: { type: Boolean, default: false },
    breakEndReminderSent: { type: Boolean, default: false },
    breakOvertimeAlertSent: { type: Boolean, default: false },

    reportReminderSent: { type: Boolean, default: false },
    workCompletedSent: { type: Boolean, default: false },
    breakTakeReminderSent: {
      type: Boolean,
      default: false,
    },
    punchOutReminderSent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

/* ======================
   INDEX
====================== */

workRecordSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("WorkRecord", workRecordSchema);
