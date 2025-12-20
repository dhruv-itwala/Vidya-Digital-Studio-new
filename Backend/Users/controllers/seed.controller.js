import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

export const seedAdmin = async (req, res) => {
  const { name, email, password, contactNo, dateOfBirth, joiningDate } =
    req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: "Admin already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
    contactNo,
    dateOfBirth,
    joiningDate,
  });

  res.status(201).json({
    message: "Admin created successfully",
    admin: {
      id: admin._id,
      email: admin.email,
      role: admin.role,
    },
  });
};
