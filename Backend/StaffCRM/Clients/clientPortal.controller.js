import Client from "./Client.model.js";
import { generateToken } from "../utils/jwt.util.js";
import bcrypt from "bcryptjs";
import AppError from "../utils/AppError.js";

// Client Login
export const clientLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError("Please provide email and password", 400);
    }

    const client = await Client.findOne({ email }).select("+password");

    if (!client || !client.password) {
      throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await bcrypt.compare(password, client.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!client.isActive) {
      throw new AppError("Client account is inactive", 403);
    }

    // Generate token with role 'client'
    const token = generateToken({ id: client._id, role: "client" });

    // Remove password from output
    client.password = undefined;

    res.status(200).json({
      status: "success",
      token,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

// Get Client Dashboard
export const getClientDashboard = async (req, res, next) => {
  try {
    const clientId = req.client.id; // from clientProtect middleware

    const client = await Client.findById(clientId).select("-password -credentials");

    if (!client) {
      throw new AppError("Client not found", 404);
    }

    res.status(200).json({
      status: "success",
      data: client,
    });
  } catch (error) {
    next(error);
  }
};
