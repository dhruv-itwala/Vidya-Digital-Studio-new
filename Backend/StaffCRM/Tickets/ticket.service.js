import Ticket from "./ticket.model.js";
import AppError from "../utils/AppError.js";

export const createTicketService = async (userId, data) => {
  const { title, description } = data;
  if (!title || !description) {
    throw new AppError("Title and description are required", 400);
  }
  return Ticket.create({
    title,
    description,
    createdBy: userId,
  });
};

export const getMyTicketsService = async (userId) => {
  return Ticket.find({ createdBy: userId }).sort({ createdAt: -1 }).lean();
};

export const getAllTicketsService = async () => {
  return Ticket.find()
    .populate("createdBy", "name email profilePicture")
    .populate("resolvedBy", "name")
    .sort({ createdAt: -1 })
    .lean();
};

export const updateTicketStatusService = async (ticketId, adminId, status, resolutionNote) => {
  const allowedStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED"];
  if (!allowedStatuses.includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const updateData = { status };
  if (status === "RESOLVED") {
    updateData.resolvedBy = adminId;
    if (resolutionNote) updateData.resolutionNote = resolutionNote;
  }

  const ticket = await Ticket.findByIdAndUpdate(ticketId, updateData, { new: true });
  if (!ticket) {
    throw new AppError("Ticket not found", 404);
  }
  return ticket;
};
