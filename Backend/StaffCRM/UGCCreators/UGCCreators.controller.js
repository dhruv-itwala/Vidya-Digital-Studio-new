// ============================
// UGCCreator.controller.js
// ============================
import * as service from "./UGCCreators.service.js";

export const create = async (req, res) => {
  try {
    const data = await service.createUGCCreator(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const data = await service.getAllUGCCreators(req.query);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const data = await service.updateUGCCreator(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const data = await service.deleteUGCCreator(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
