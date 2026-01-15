import express from "express";
import {
  createClient,
  getAllClients,
  getClient,
  updateClient,
  deleteClient,
} from "./client.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const clientRoutes = express.Router();

clientRoutes.use(protect);

clientRoutes.post("/", createClient);
clientRoutes.get("/", getAllClients);
clientRoutes.get("/:id", getClient);
clientRoutes.put("/:id", updateClient);
clientRoutes.delete("/:id", deleteClient);

export default clientRoutes;
