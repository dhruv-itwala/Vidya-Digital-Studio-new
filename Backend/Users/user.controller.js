import {
  createUserService,
  loginService,
  getAllUsersService,
  getProfileService,
  updateUserService,
  deleteUserService,
  getEmployeeBirthdaysService,
  salaryDeductionService,
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

export const getEmployeeBirthdays = async (req, res) => {
  const birthdays = await getEmployeeBirthdaysService();
  res.json(birthdays);
};

export const mySalaryDeduction = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      throw new Error("from and to are required");
    }

    const data = await salaryDeductionService(req.user.id, from, to);

    res.json({
      success: true,
      user: req.user.id,
      ...data,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// HR/Admin → View any employee salary
export const employeeSalaryDeduction = async (req, res) => {
  try {
    if (req.user.role === "employee") {
      throw new Error("Access denied");
    }

    const { userId, from, to } = req.query;
    if (!userId || !from || !to) {
      throw new Error("userId, from, to are required");
    }

    const data = await salaryDeductionService(userId, from, to);

    res.json({
      success: true,
      user: userId,
      ...data,
    });
  } catch (e) {
    res.status(403).json({ message: e.message });
  }
};
