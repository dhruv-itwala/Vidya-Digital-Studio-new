import axios from "axios";
import NotificationLog from "../Notifications/notification.model.js";

export const sendWhatsAppText = async (phone, message) => {
  const formattedPhone = `91${phone.replace(/^0+/, "")}`;

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

    // ✅ Save success log
    await NotificationLog.create({
      phone: formattedPhone,
      message,
      status: "SUCCESS",
      response: res.data,
    });

    return res.data;
  } catch (err) {
    console.error("WhatsApp error:", err.response?.data || err.message);

    // ❌ Save failure log
    await NotificationLog.create({
      phone: formattedPhone,
      message,
      status: "FAILED",
      error: err.response?.data || err.message,
    });

    throw err;
  }
};
