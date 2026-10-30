// Backend/Invoice/controllers/InvoiceAuth.controller.js
import bcrypt from "bcryptjs";
import User from "../../StaffCRM/Users/user.model.js";
import { signToken } from "../../StaffCRM/utils/jwt.util.js";
import { logActivity } from "../../StaffCRM/AuditLog/AuditLog.service.js";

/* ================= INVOICE ADMIN / HR LOGIN ================= */
export const loginInvoice = async (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.id || req.body.email || req.body.phone;
    const password = req.body.password;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both ID/Email and Password.",
      });
    }

    const cleanIdentifier = String(identifier).trim();

    // Query active user by email (case-insensitive) or 10-digit phone number
    const user = await User.findOne({
      isActive: true,
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { phone: cleanIdentifier },
      ],
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please verify your ID/Email and password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please verify your ID/Email and password.",
      });
    }

    // Strict Role Enforcement: only Admin and HR (plus super-administrative)
    const allowedRoles = ["administrative", "admin", "hr"];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Only CRM Admin and HR personnel are authorized to access the Invoice software.",
      });
    }

    // Generate JWT token
    const token = signToken({
      id: user._id,
      role: user.role,
    });

    // Log login activity to CRM AuditLog
    try {
      await logActivity({
        req,
        user,
        category: "Authentication",
        module: "Invoice",
        action: "LOGIN",
        entityId: user._id,
        entityName: user.name,
        description: `${user.name} (${user.role.toUpperCase()}) authenticated into Invoice Studio`,
      });
    } catch (auditErr) {
      console.warn("[Invoice Auth] AuditLog warning:", auditErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}! Access granted.`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        designation: user.designation || "",
        profilePicture: user.profilePicture?.url || "",
      },
    });
  } catch (error) {
    console.error("[Invoice Auth] Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during authentication. Please try again.",
      error: error.message,
    });
  }
};

/* ================= VERIFY PROFILE / CURRENT SESSION ================= */
export const getInvoiceAuthMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || "",
        role: req.user.role,
        designation: req.user.designation || "",
        profilePicture: req.user.profilePicture?.url || "",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify session",
      error: error.message,
    });
  }
};

