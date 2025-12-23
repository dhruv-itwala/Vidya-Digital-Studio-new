import * as service from "./leave.service.js";

export const applyLeave = async (req, res) => {
  try {
    res.json(await service.applyLeaveService(req.user.id, req.body));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const myLeaves = async (req, res) => {
  res.json(await service.getMyLeavesService(req.user.id));
};

export const allLeaves = async (req, res) => {
  res.json(await service.getAllLeavesService());
};

export const approveLeave = async (req, res) => {
  try {
    res.json(await service.approveLeaveService(req.params.id, req.user.id));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const declineLeave = async (req, res) => {
  try {
    res.json(await service.declineLeaveService(req.params.id, req.user.id));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const cancelLeave = async (req, res) => {
  try {
    res.json(await service.cancelLeaveService(req.params.id, req.user.id));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const leaveSummary = async (req, res) => {
  res.json(await service.leaveSummaryService(req.user.id));
};
