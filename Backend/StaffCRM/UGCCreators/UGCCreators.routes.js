// ============================
// UGCCreators.routes.js
// ============================
import express from "express";
import * as controller from "./UGCCreators.controller.js";

const ugcCreatorRoutes = express.Router();

ugcCreatorRoutes.post("/", controller.create);
ugcCreatorRoutes.get("/", controller.getAll);
ugcCreatorRoutes.put("/:id", controller.update);
ugcCreatorRoutes.delete("/:id", controller.remove);

export default ugcCreatorRoutes;
