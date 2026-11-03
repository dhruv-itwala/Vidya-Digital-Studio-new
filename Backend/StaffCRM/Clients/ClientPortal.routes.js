import express from "express";
import * as ctrl from "./clientPortal.controller.js";
import { clientProtect } from "../middleware/auth.middleware.js";

const ClientPortalRoutes = express.Router();

// Public routes for clients
ClientPortalRoutes.post("/login", ctrl.clientLogin);
ClientPortalRoutes.get("/lookup-brand", ctrl.lookupClientBrand);

// Protected routes for clients
ClientPortalRoutes.use(clientProtect);
ClientPortalRoutes.get("/me", ctrl.getClientDashboard);
ClientPortalRoutes.get("/me/credentials", ctrl.getClientCredentials);
ClientPortalRoutes.post("/me/credentials", ctrl.addClientCredential);
ClientPortalRoutes.delete("/me/credentials/:credId", ctrl.deleteClientCredential);
ClientPortalRoutes.get("/invoices", ctrl.getClientInvoices);

export default ClientPortalRoutes;
