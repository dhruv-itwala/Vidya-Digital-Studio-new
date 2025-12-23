// routes/quote.routes.js
import express from "express";
import { ping } from "./Utils.controller.js";

const utilsRoutes = express.Router();

utilsRoutes.get("/ping", ping);

export default utilsRoutes;
