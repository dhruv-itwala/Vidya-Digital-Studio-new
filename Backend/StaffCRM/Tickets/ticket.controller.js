
import { asyncHandler } from "../utils/asyncHandler.js";
import * as service from "./ticket.service.js";

export const createTicket = asyncHandler(async (req, res) => {
  const data = await service.createTicketService(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const data = await service.getMyTicketsService(req.user.id);
  res.json({ success: true, count: data.length, data });
});

export const getAllTickets = asyncHandler(async (req, res) => {
  const data = await service.getAllTicketsService();
  res.json({ success: true, count: data.length, data });
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, resolutionNote } = req.body;
  const data = await service.updateTicketStatusService(id, req.user.id, status, resolutionNote);
  res.json({ success: true, data });
});
