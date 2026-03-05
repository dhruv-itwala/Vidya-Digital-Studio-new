import mongoose from "mongoose";
import Lead from "./Lead.model.js";
import Client from "../Clients/Client.model.js";
import AppError from "../utils/AppError.js";
import { getISTDayRange, normalizeDate } from "../utils/date.utils.js";

/* ================= CREATE ================= */
export const createLeadService = async (data, userId) => {
  data.createdBy = userId;

  // Optional duplicate prevention (email + phone)
  if (data.email || data.phone) {
    const existing = await Lead.findOne({
      $or: [{ email: data.email || null }, { phone: data.phone || null }],
    });

    if (existing) {
      throw new AppError("Lead with same email or phone already exists", 400);
    }
  }

  return Lead.create(data);
};

/* ================= GET ALL (FILTER + SEARCH + PAGINATION) ================= */
export const getAllLeadsService = async ({
  page = 1,
  limit = 10,
  status,
  search,
  date,
}) => {
  const query = {};

  // Status filter
  if (status) {
    query.status = status;
  }

  // Search filter (name, email, phone)
  if (search) {
    query.$or = [
      { clientName: { $regex: search, $options: "i" } },
      { ownerName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  // Date filter (IST safe)
  if (date) {
    const { start, end } = getISTDayRange(date);
    query.createdAt = { $gte: start, $lt: end };
  }

  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    Lead.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Lead.countDocuments(query),
  ]);

  return {
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: leads,
  };
};

/* ================= GET ONE ================= */
export const getLeadByIdService = async (leadId) => {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new AppError("Invalid lead id", 400);
  }

  const lead = await Lead.findById(leadId)
    .populate("createdBy", "name email")
    .populate("meetingNotes.addedBy", "name");

  if (!lead) throw new AppError("Lead not found", 404);

  return lead;
};

/* ================= UPDATE ================= */
export const updateLeadService = async (leadId, data) => {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new AppError("Invalid lead id", 400);
  }

  const lead = await Lead.findById(leadId);
  if (!lead) throw new AppError("Lead not found", 404);

  if (lead.isConverted) {
    throw new AppError("Converted lead cannot be modified", 400);
  }

  return Lead.findByIdAndUpdate(leadId, data, {
    new: true,
    runValidators: true,
  });
};

/* ================= DELETE ================= */
export const deleteLeadService = async (leadId) => {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new AppError("Invalid lead id", 400);
  }

  const lead = await Lead.findById(leadId);
  if (!lead) throw new AppError("Lead not found", 404);

  await Lead.deleteOne({ _id: leadId });

  return { deletedLeadId: leadId };
};

/* ================= ADD MEETING NOTE ================= */
export const addMeetingNoteService = async (leadId, note, userId) => {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new AppError("Invalid lead id", 400);
  }

  const lead = await Lead.findById(leadId);
  if (!lead) throw new AppError("Lead not found", 404);

  if (lead.isConverted) {
    throw new AppError("Cannot modify converted lead", 400);
  }

  lead.meetingNotes.push({
    note,
    addedBy: userId,
    date: new Date(),
  });

  await lead.save();
  return lead;
};

/* ================= UPDATE STATUS ================= */
export const updateLeadStatusService = async (leadId, status, userId) => {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new AppError("Invalid lead id", 400);
  }

  const lead = await Lead.findById(leadId);
  if (!lead) throw new AppError("Lead not found", 404);

  if (lead.isConverted) {
    throw new AppError("Converted lead status cannot be changed", 400);
  }

  lead.status = status;

  // Optional: track status history (if you later add it)
  // lead.statusHistory.push({ status, changedBy: userId });

  await lead.save();

  return lead;
};

/* ================= CONVERT TO CLIENT ================= */
export const convertLeadToClientService = async (leadId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new AppError("Invalid lead id", 400);
  }

  const lead = await Lead.findById(leadId);
  if (!lead) throw new AppError("Lead not found", 404);

  if (lead.isConverted) {
    throw new AppError("Lead already converted", 400);
  }

  if (lead.status !== "Client Won") {
    throw new AppError("Only 'Client Won' leads can be converted", 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  const now = new Date();
  try {
    const client = await Client.create(
      [
        {
          profilePhoto: lead.profilePhoto,
          clientName: lead.clientName,
          ownerName: lead.ownerName,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          services: lead.services,
          notes: lead.notes,
          onboardingDate: now,
          createdBy: userId,
        },
      ],
      { session },
    );

    lead.isConverted = true;
    lead.status = "Transferred";
    lead.convertedAt = new Date();
    await lead.save({ session });

    await session.commitTransaction();
    session.endSession();

    return client[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError("Conversion failed", 500);
  }
};
