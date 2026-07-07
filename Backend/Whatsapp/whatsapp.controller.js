import { processMessage } from "./whatsapp.service.js";

export const verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
};

// export const receiveMessage = async (req, res) => {
//   try {
//     await processMessage(req.body);
//     res.sendStatus(200);
//   } catch (err) {
//     console.error(err);
//     res.sendStatus(500);
//   }
// };

// vsgdjhfvsjhvbcjhsvfhjsvhjsvfhsabhcjvsd

// export const receiveMessage = async (req, res) => {
//   console.log("🔥 REAL WHATSAPP WEBHOOK HIT");
//   console.log(JSON.stringify(req.body, null, 2));

//   res.sendStatus(200);

//   try {
//     await processMessage(req.body);
//   } catch (err) {
//     console.error("PROCESS ERROR:", err.response?.data || err.message);
//   }
// };

export const receiveMessage = async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;

    console.log("🔥 WHATSAPP WEBHOOK:", JSON.stringify(body, null, 2));

    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;

        if (value?.statuses?.length) {
          for (const status of value.statuses) {
            console.log("📊 WHATSAPP STATUS:", {
              messageId: status.id,
              recipient: status.recipient_id,
              status: status.status,
            });

            if (status.errors?.length) {
              console.log(
                "❌ DELIVERY ERROR:",
                JSON.stringify(status.errors, null, 2),
              );
            }
          }
        }
      }
    }

    await processMessage(body);
  } catch (error) {
    console.error("❌ WhatsApp webhook processing error:", error);
  }
};
