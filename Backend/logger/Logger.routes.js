import express from "express";
import APILog from "./Logger.model.js";

const loggerRoutes = express.Router();

loggerRoutes.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 2000,
      method,
      statusCode,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {};

    // 🔍 Filter by method (GET, POST, etc.)
    if (method) {
      query.method = method.toUpperCase();
    }

    // 🔍 Filter by status code
    if (statusCode) {
      query.statusCode = Number(statusCode);
    }

    // 🔍 Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // 🔍 Search endpoint
    if (search) {
      query.endpoint = { $regex: search, $options: "i" };
    }

    const logs = await APILog.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 }) // latest first
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await APILog.countDocuments(query);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: logs,
    });
  } catch (err) {
    console.error("❌ Fetch Logs Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default loggerRoutes;
