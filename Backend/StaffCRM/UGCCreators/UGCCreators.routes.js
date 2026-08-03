// ============================
// UGCCreators.routes.js
// ============================
import express from "express";
import * as controller from "./UGCCreators.controller.js";
import { protect } from "../middleware/auth.middleware.js";


const ugcCreatorRoutes = express.Router();
ugcCreatorRoutes.use(protect);


ugcCreatorRoutes.post("/", controller.create);
ugcCreatorRoutes.get("/", controller.getAll);
ugcCreatorRoutes.put("/:id", controller.update);
ugcCreatorRoutes.delete("/:id", controller.remove);

export default ugcCreatorRoutes;
