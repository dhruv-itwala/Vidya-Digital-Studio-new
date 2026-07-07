import axios from "axios";
import User from "../StaffCRM/Users/user.model.js";

/* =====================================
   CONFIG
===================================== */

const WHATSAPP_API_URL = () =>
  `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
});

/* =====================================
   PHONE FORMATTER
===================================== */

const formatPhone = (phone) => {
  let cleaned = String(phone || "").replace(/\D/g, "");

  // Already: 91XXXXXXXXXX
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

/* =====================================
   1. NORMAL TEXT MESSAGE

   Use:
   - Testing
   - Chatbot replies
   - Active service window
===================================== */

export const sendWhatsAppText = async (phone, message) => {
  const formattedPhone = formatPhone(phone);

  try {
    const res = await axios.post(
      WHATSAPP_API_URL(),

      {
        messaging_product: "whatsapp",

        recipient_type: "individual",

        to: formattedPhone,

        type: "text",

        text: {
          preview_url: false,
          body: message,
        },
      },

      {
        headers: getHeaders(),
      },
    );

    console.log("✅ WhatsApp text accepted:", {
      phone: formattedPhone,

      messageId: res.data?.messages?.[0]?.id,
    });

    return res.data;
  } catch (err) {
    console.error("❌ WhatsApp text error:", {
      phone: formattedPhone,

      error: err.response?.data || err.message,
    });

    throw err;
  }
};

/* =====================================
   2. EMPLOYEE TEMPLATE MESSAGE

   Meta template:

   Hello {{1}},

   This is an automated work attendance
   reminder for your employee account.

   Action required: {{2}}

   Please complete this action in the
   VDS CRM.

   – Vidya Digital Studio
===================================== */

export const sendEmployeeTemplate = async (
  phone,
  employeeName,
  actionMessage,
) => {
  const formattedPhone = formatPhone(phone);

  try {
    const res = await axios.post(
      WHATSAPP_API_URL(),

      {
        messaging_product: "whatsapp",

        recipient_type: "individual",

        to: formattedPhone,

        type: "template",

        template: {
          /*
            IMPORTANT:
            Replace this with the exact
            template name submitted to Meta.
          */

          name: "employee_work_action_reminder",

          language: {
            code: "en",
          },

          components: [
            {
              type: "body",

              parameters: [
                {
                  type: "text",
                  text: String(employeeName),
                },

                {
                  type: "text",
                  text: String(actionMessage),
                },
              ],
            },
          ],
        },
      },

      {
        headers: getHeaders(),
      },
    );

    const messageId = res.data?.messages?.[0]?.id;

    console.log("✅ Employee template accepted:", {
      employee: employeeName,
      phone: formattedPhone,
      action: actionMessage,
      messageId,
    });

    return res.data;
  } catch (err) {
    console.error("❌ Employee template error:", {
      employee: employeeName,

      phone: formattedPhone,

      action: actionMessage,

      error: err.response?.data || err.message,
    });

    throw err;
  }
};

/* =====================================
   3. TEST NORMAL TEXT MESSAGE
===================================== */

export const testWhatsApp = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("name phone");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.phone) {
      return res.status(400).json({
        success: false,
        message: "User does not have a phone number",
      });
    }

    const result = await sendWhatsAppText(
      user.phone,

      `Hello ${user.name} 👋

This is a test message from the VDS CRM automation system.`,
    );

    return res.status(200).json({
      success: true,

      message: "WhatsApp text message accepted",

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

/* =====================================
   4. TEST TEMPLATE MESSAGE
===================================== */

export const testEmployeeTemplate = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("name phone");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.phone) {
      return res.status(400).json({
        success: false,

        message: "User does not have a phone number",
      });
    }

    const result = await sendEmployeeTemplate(
      user.phone,

      user.name,

      "Punch in for today's shift.",
    );

    return res.status(200).json({
      success: true,

      message: "Employee template accepted by WhatsApp",

      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: "Failed to send employee template",

      error: error.response?.data || error.message,
    });
  }
};
