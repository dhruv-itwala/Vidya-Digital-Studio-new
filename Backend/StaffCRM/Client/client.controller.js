import {
  createClientService,
  getAllClientsService,
  getClientByIdService,
  updateClientService,
  deleteClientService,
} from "./client.service.js";

export const createClient = async (req, res) => {
  try {
    const client = await createClientService(req.body);
    res.status(201).json({ success: true, client });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllClients = async (req, res) => {
  try {
    const clients = await getAllClientsService();
    res.json({ success: true, clients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getClient = async (req, res) => {
  try {
    const client = await getClientByIdService(req.params.id);
    res.json({ success: true, client });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const client = await updateClientService(req.params.id, req.body);
    res.json({ success: true, client });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteClient = async (req, res) => {
  try {
    await deleteClientService(req.params.id);
    res.json({ success: true, message: "Client removed" });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};
