import {
  createUserService,
  loginService,
  getAllUsersService,
  getProfileService,
  updateProfileService,
} from "../services/user.service.js";
import { signToken } from "../../utils/jwt.util.js";
import userModel from "../models/user.model.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await loginService(email, password);

    const token = signToken({
      id: user._id,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ADMIN ONLY
export const createUser = async (req, res) => {
  try {
    const user = await createUserService(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  const users = await getAllUsersService();
  res.json(users);
};

// GET LOGGED-IN USER PROFILE
export const getProfile = async (req, res) => {
  const user = await getProfileService(req.user.id);
  res.json(user);
};

// UPDATE LOGGED-IN USER PROFILE
export const updateProfile = async (req, res) => {
  const updatedUser = await updateProfileService(req.user.id, req.body);
  res.json(updatedUser);
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Update user
    const updatedUser = await userModel.findByIdAndUpdate(userId, req.body, {
      new: true, // return the updated document
      runValidators: true, // enforce schema validation
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};
