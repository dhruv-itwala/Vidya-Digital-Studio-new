import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

export const createUserService = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return User.create({
    ...data,
    password: hashedPassword,
  });
};

export const loginService = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new Error("Invalid credentials");

  if (!user.isActive) throw new Error("User is disabled");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  return user;
};

export const getAllUsersService = async () => {
  return User.find().select("-password");
};

export const getProfileService = async (userId) => {
  return User.findById(userId).select("-password");
};

export const updateProfileService = async (userId, data) => {
  delete data.password; // prevent password update here
  delete data.role; // prevent role change

  return User.findByIdAndUpdate(userId, data, {
    new: true,
    runValidators: true,
  }).select("-password");
};
