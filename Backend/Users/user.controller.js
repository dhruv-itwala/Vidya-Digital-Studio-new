import {
  createUserService,
  loginService,
  getAllUsersService,
  getProfileService,
  updateUserService,
  deleteUserService,
} from "./user.service.js";
import { signToken } from "../utils/jwt.util.js";

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await loginService(email, password);

  const token = signToken({ id: user._id, role: user.role });

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

export const getProfile = async (req, res) => {
  const user = await getProfileService(req.user.id);
  res.json(user);
};

export const createUser = async (req, res) => {
  const user = await createUserService(req.body);
  res.status(201).json(user);
};

export const updateUser = async (req, res) => {
  const updatedUser = await updateUserService(
    req.user,
    req.params.id,
    req.body
  );

  res.json({ message: "User updated", user: updatedUser });
};

export const deleteUser = async (req, res) => {
  try {
    await deleteUserService(req.user, req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  res.json(await getAllUsersService());
};
