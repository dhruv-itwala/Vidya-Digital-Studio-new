import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createClientService,
  updateClientService,
  getAllClientsService,
  getClientByIdService,
  deleteClientService,
  updateClientProfilePhotoService,
} from "./client.service.js";

// CREATE
export const createClient = asyncHandler(async (req, res) => {
  console.log("FILE:", req.file); // 👈 REQUIRED
  console.log("BODY:", req.body);

  const client = await createClientService(
    req.body,
    req.user.id,
    req.file, // ✅ pass uploaded image (if any)
  );

  res.status(201).json({
    success: true,
    data: client,
  });
});

// UPDATE
export const updateClient = asyncHandler(async (req, res) => {
  console.log("FILE:", req.file); // 👈 REQUIRED
  console.log("BODY:", req.body);

  const client = await updateClientService(
    req.params.id,
    req.body,
    req.file, // ✅ pass uploaded image (if any)
  );

  res.json({
    success: true,
    data: client,
  });
});

// GET ALL
export const getAllClients = asyncHandler(async (req, res) => {
  const clients = await getAllClientsService();
  res.json({
    success: true,
    data: clients,
  });
});

// GET ONE
export const getClientById = asyncHandler(async (req, res) => {
  const client = await getClientByIdService(req.params.id);
  res.json({
    success: true,
    data: client,
  });
});

// DELETE (Soft)
export const deleteClient = asyncHandler(async (req, res) => {
  await deleteClientService(req.params.id);
  res.json({
    success: true,
    message: "Client deleted successfully",
  });
});

// UPDATE PROFILE PHOTO ONLY
export const updateClientProfilePhoto = asyncHandler(async (req, res) => {
  const { image } = req.body;

  const client = await updateClientProfilePhotoService(req.params.id, image);

  res.json({
    success: true,
    message: "Profile photo updated successfully",
    data: {
      _id: client._id,
      profilePhoto: client.profilePhoto,
    },
  });
});
