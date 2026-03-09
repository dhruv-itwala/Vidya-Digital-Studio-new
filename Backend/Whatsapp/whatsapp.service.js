import axios from "axios";

export const processMessage = async (body) => {
  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message) return;

  const from = message.from;
  const text = message.text?.body?.toLowerCase();

  if (text?.includes("hello")) {
    await sendServiceMenu(from);
  }
};
const sendServiceMenu = async (to) => {
  await axios.post(
    `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: to,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: "Please select a service 👇",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "service_1",
                title: "Website Development",
              },
            },
            {
              type: "reply",
              reply: {
                id: "service_2",
                title: "Digital Marketing",
              },
            },
            {
              type: "reply",
              reply: {
                id: "service_3",
                title: "Talk to Expert",
              },
            },
          ],
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    },
  );
};
