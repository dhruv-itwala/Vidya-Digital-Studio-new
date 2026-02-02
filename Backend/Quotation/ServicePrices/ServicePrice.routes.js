// routes/ServicePrice.routes.js
import { Router } from "express";
import mongoose from "mongoose";

const servicePricesRoute = Router();

const getCollection = () => mongoose.connection.collection("service_prices");

// GET all services
servicePricesRoute.get("/", async (req, res) => {
  try {
    const data = await getCollection().find({}).toArray();

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching service prices",
      error: err.message,
    });
  }
});

// GET by category
servicePricesRoute.get("/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const data = await getCollection().find({ category }).toArray();

    if (!data.length) {
      return res.status(404).json({
        success: false,
        message: "No services found for this category",
      });
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching service prices",
      error: err.message,
    });
  }
});

export default servicePricesRoute;
