import { asyncHandler } from "../utils/asyncHandler.js";
import * as LeadService from "./Lead.service.js";

/* ================= CREATE ================= */
export const createLead = asyncHandler(async (req, res) => {
  const lead = await LeadService.createLeadService(req.body, req.user._id);

  res.status(201).json({
    success: true,
    message: "Lead created successfully",
    data: lead,
  });
});

/* ================= GET ALL ================= */
export const getAllLeads = asyncHandler(async (req, res) => {
  const result = await LeadService.getAllLeadsService({
    page: req.query.page,
    limit: req.query.limit,
    proposal: req.query.proposal,
    status: req.query.status,
    search: req.query.search,
    date: req.query.date,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

/* ================= GET ONE ================= */
export const getLeadById = asyncHandler(async (req, res) => {
  const lead = await LeadService.getLeadByIdService(req.params.id);

  res.status(200).json({
    success: true,
    data: lead,
  });
});

/* ================= UPDATE ================= */
export const updateLead = asyncHandler(async (req, res) => {
  const updated = await LeadService.updateLeadService(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: "Lead updated successfully",
    data: updated,
  });
});

/* ================= DELETE ================= */
export const deleteLead = asyncHandler(async (req, res) => {
  const result = await LeadService.deleteLeadService(req.params.id);

  res.status(200).json({
    success: true,
    message: "Lead deleted successfully",
    data: result,
  });
});

/* ================= ADD MEETING NOTE ================= */
export const addMeetingNote = asyncHandler(async (req, res) => {
  const { note, date } = req.body;
  if (!note || !date) {
    throw new AppError("Note and date are required", 400);
  }
  const updated = await LeadService.addMeetingNoteService(
    req.params.id,
    note,
    date,
    req.user._id,
  );

  res.status(200).json({
    success: true,
    message: "Meeting note added",
    data: updated,
  });
});

/* ================= UPDATE STATUS ================= */
export const updateLeadStatus = asyncHandler(async (req, res) => {
  const updated = await LeadService.updateLeadStatusService(
    req.params.id,
    req.body.status,
    req.user._id,
  );

  res.status(200).json({
    success: true,
    message: "Status updated",
    data: updated,
  });
});

/* ================= UPDATE PROPOSAL ================= */
export const updateLeadProposal = asyncHandler(async (req, res) => {
  const { proposal } = req.body;

  if (!proposal) {
    throw new AppError("Proposal status is required", 400);
  }

  const updated = await LeadService.updateProposalStatusService(
    req.params.id,
    proposal,
  );

  res.status(200).json({
    success: true,
    message: "Proposal status updated",
    data: updated,
  });
});

/* ================= CONVERT ================= */
export const convertLead = asyncHandler(async (req, res) => {
  const client = await LeadService.convertLeadToClientService(
    req.params.id,
    req.user._id,
  );

  res.status(201).json({
    success: true,
    message: "Lead converted to client",
    data: client,
  });
});
