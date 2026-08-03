// ============================
// Influencers.routes.js
// ============================
import express from "express";
import * as controller from "./Influencers.controller.js";
import { protect } from "../middleware/auth.middleware.js";


const influencerRoutes = express.Router();
influencerRoutes.use(protect);


influencerRoutes.post("/", controller.create);
influencerRoutes.get("/", controller.getAll);
influencerRoutes.put("/:id", controller.update);
influencerRoutes.delete("/:id", controller.remove);

export default influencerRoutes;
