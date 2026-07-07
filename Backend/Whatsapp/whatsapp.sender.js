import axios from "axios";
import User from "../StaffCRM/Users/user.model.js";
export const sendWhatsAppText = async (phone, message) => {
  const formatPhone = (phone) => {
    let cleaned = String(phone).replace(/\D/g, "");

    // +91XXXXXXXXXX or 91XXXXXXXXXX
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return cleaned;
    }

    // 0XXXXXXXXXX
    if (cleaned.length === 11 && cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }

    // XXXXXXXXXX
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }

    throw new Error(`Invalid Indian phone number: ${phone}`);
  };

  const formattedPhone = formatPhone(phone);

  try {
    const res = await axios.post(
      `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (err) {
    console.error("WhatsApp error:", err.response?.data || err.message);

    throw err;
  }
};

export const testWhatsApp = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("name phone");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const result = await sendWhatsAppText(
      user.phone,
      `Hello ${user.name} 👋\n\nThis is a test message from the VDS CRM automation system.`,
    );

    return res.status(200).json({
      success: true,
      message: "WhatsApp message sent",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send WhatsApp message",
      error: error.response?.data || error.message,
    });
  }
};
