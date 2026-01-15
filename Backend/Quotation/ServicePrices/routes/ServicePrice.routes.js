// routes/ServicePrice.routes.js
import { Router } from "express";
import {
  fetchAllServicePrices,
  fetchServicePricesByCategory,
} from "../controllers/ServicePrice.controller.js";

const servicePricesRoute = Router();

// GET all services
servicePricesRoute.get("/", fetchAllServicePrices);

// GET all services from a specific category
servicePricesRoute.get("/:category", fetchServicePricesByCategory);

export default servicePricesRoute;
