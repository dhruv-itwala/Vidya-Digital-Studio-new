import express from "express";
import { seedAdmin } from "../controllers/seed.controller.js";

const seedRoutes = express.Router();

// TEMPORARY — REMOVE AFTER USE
seedRoutes.post("/seed-admin", seedAdmin);

export default seedRoutes;
