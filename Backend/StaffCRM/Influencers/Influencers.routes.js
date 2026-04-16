// ============================
// Influencers.routes.js
// ============================
import express from "express";
import * as controller from "./Influencers.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { apiLogger } from "../../logger/logger.middleware.js";

const influencerRoutes = express.Router();
influencerRoutes.use(protect);
influencerRoutes.use(apiLogger);

influencerRoutes.post("/", controller.create);
influencerRoutes.get("/", controller.getAll);
influencerRoutes.put("/:id", controller.update);
influencerRoutes.delete("/:id", controller.remove);

export default influencerRoutes;
