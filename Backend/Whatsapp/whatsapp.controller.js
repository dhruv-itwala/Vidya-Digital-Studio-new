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

export const receiveMessage = async (req, res) => {
  try {
    await processMessage(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};