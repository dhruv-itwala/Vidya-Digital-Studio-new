import express from "express";
import * as ctrl from "./contentTask.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const ContentTaskRoutes = express.Router();

ContentTaskRoutes.use(protect);

// CRUD for content tasks
ContentTaskRoutes.post("/", ctrl.createContentTask);
ContentTaskRoutes.get("/", ctrl.getAllContentTasks);
ContentTaskRoutes.get("/client/:clientId", ctrl.getClientContentTasks);
ContentTaskRoutes.patch("/:id", ctrl.updateContentTask);
ContentTaskRoutes.delete("/:id", ctrl.deleteContentTask);

export default ContentTaskRoutes;
