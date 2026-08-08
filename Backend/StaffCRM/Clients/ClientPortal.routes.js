import express from "express";
import * as ctrl from "./clientPortal.controller.js";
import { clientProtect } from "../middleware/auth.middleware.js";

const ClientPortalRoutes = express.Router();

// Public routes for clients
ClientPortalRoutes.post("/login", ctrl.clientLogin);

// Protected routes for clients
ClientPortalRoutes.use(clientProtect);
ClientPortalRoutes.get("/me", ctrl.getClientDashboard);
ClientPortalRoutes.get("/me/credentials", ctrl.getClientCredentials);

export default ClientPortalRoutes;
