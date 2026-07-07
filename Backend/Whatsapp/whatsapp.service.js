import axios from "axios";

const WA_URL = `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
});

/* =====================================================
   PROCESS INCOMING MESSAGE
===================================================== */

export const processMessage = async (body) => {
  const value = body.entry?.[0]?.changes?.[0]?.value;

  const message = value?.messages?.[0];

  if (!message) {
    console.log("Webhook received but no user message");
    return;
  }

  const from = message.from;

  const text = message?.text?.body?.toLowerCase()?.trim();

  const buttonReply = message?.interactive?.button_reply?.id;

  const listReply = message?.interactive?.list_reply?.id;

  console.log("================================");
  console.log("FROM:", from);
  console.log("TYPE:", message.type);
  console.log("TEXT:", text);
  console.log("BUTTON:", buttonReply);
  console.log("LIST:", listReply);
  console.log("================================");

  /* ---------------- HELLO ---------------- */

  if (text === "hello" || text === "hi" || text === "hey") {
    await sendServiceMenu(from);
    return;
  }

  /* ---------------- SERVICE SELECTED ---------------- */

  if (listReply) {
    await sendServiceOptions(from, listReply);
    return;
  }

  /* ---------------- BUTTON CLICK ---------------- */

  if (buttonReply) {
    // View Work
    if (buttonReply.startsWith("view_work_")) {
      const service = buttonReply.replace("view_work_", "");

      await sendProjectLink(from, service);

      return;
    }

    // Get Call
    if (buttonReply === "get_call") {
      await sendContactRedirect(from);

      return;
    }
  }

  /* ---------------- FALLBACK ---------------- */

  await sendTextMessage(
    from,
    "Sorry, I didn't understand that 😅\n\nPlease type *Hello* to see our services.",
  );
};

/* =====================================================
   SERVICE MENU
===================================================== */

const sendServiceMenu = async (to) => {
  try {
    await axios.post(
      WA_URL,

      {
        messaging_product: "whatsapp",

        to,

        type: "interactive",

        interactive: {
          type: "list",

          header: {
            type: "text",
            text: "Vidya Digital Studio",
          },

          body: {
            text: "Hello 👋\n\nHow can we help you today?\n\nPlease select the service you're interested in:",
          },

          footer: {
            text: "Creative • Digital • Technology",
          },

          action: {
            button: "Select Service",

            sections: [
              {
                title: "Our Services",

                rows: [
                  {
                    id: "graphic_design",
                    title: "Graphic & UI/UX",
                    description: "Branding, graphics and UI/UX",
                  },

                  {
                    id: "media_production",
                    title: "Media Production",
                    description: "Social media and content",
                  },

                  {
                    id: "web_app",
                    title: "Web & App Development",
                    description: "Websites and applications",
                  },

                  {
                    id: "video_editing",
                    title: "Video Editing",
                    description: "Professional video production",
                  },

                  {
                    id: "3d_modelling",
                    title: "3D Modelling",
                    description: "3D products and visualization",
                  },
                ],
              },
            ],
          },
        },
      },

      {
        headers: getHeaders(),
      },
    );

    console.log("✅ Service menu sent to:", to);
  } catch (error) {
    console.error(
      "❌ Service Menu Error:",
      error.response?.data || error.message,
    );
  }
};

/* =====================================================
   SERVICE OPTIONS
===================================================== */

const sendServiceOptions = async (to, service) => {
  const serviceNames = {
    graphic_design: "Graphic & UI/UX Design",

    media_production: "Media Production & Distribution",

    web_app: "Web & App Development",

    video_editing: "Video Editing",

    "3d_modelling": "3D Modelling",
  };

  const selectedService = serviceNames[service] || "our services";

  try {
    await axios.post(
      WA_URL,

      {
        messaging_product: "whatsapp",

        to,

        type: "interactive",

        interactive: {
          type: "button",

          body: {
            text:
              `Great choice 👍\n\n` +
              `You selected *${selectedService}*.\n\n` +
              `Would you like to view our work or request a call?`,
          },

          action: {
            buttons: [
              {
                type: "reply",

                reply: {
                  id: `view_work_${service}`,
                  title: "View Work",
                },
              },

              {
                type: "reply",

                reply: {
                  id: "get_call",
                  title: "Get a Call",
                },
              },
            ],
          },
        },
      },

      {
        headers: getHeaders(),
      },
    );

    console.log(`✅ Service options sent: ${service}`);
  } catch (error) {
    console.error(
      "❌ Service Options Error:",
      error.response?.data || error.message,
    );
  }
};

/* =====================================================
   SEND PROJECT LINK
===================================================== */

const sendProjectLink = async (to, service) => {
  const links = {
    graphic_design: "https://vidyadigitalstudio.com/projects/graphic-designing",

    media_production:
      "https://vidyadigitalstudio.com/projects/social-media-management",

    web_app: "https://vidyadigitalstudio.com/projects/web-and-app",

    video_editing: "https://vidyadigitalstudio.com/projects/video-editing",

    "3d_modelling": "https://vidyadigitalstudio.com/projects/3d-modelling",
  };

  const projectLink = links[service];

  if (!projectLink) {
    await sendTextMessage(to, "Sorry, we couldn't find that portfolio page.");

    return;
  }

  await sendTextMessage(
    to,
    `Here are some of our projects 🚀\n\n${projectLink}\n\nFeel free to explore our work.`,
  );
};

/* =====================================================
   CONTACT REDIRECT
===================================================== */

const sendContactRedirect = async (to) => {
  await sendTextMessage(
    to,

    `Thank you for your interest! 📞\n\n` +
      `Our team will contact you shortly.\n\n` +
      `You can also submit your requirements here:\n` +
      `https://vidyadigitalstudio.com/contact-us`,
  );
};

/* =====================================================
   GENERIC TEXT MESSAGE
===================================================== */

const sendTextMessage = async (to, message) => {
  try {
    await axios.post(
      WA_URL,

      {
        messaging_product: "whatsapp",

        to,

        type: "text",

        text: {
          preview_url: true,
          body: message,
        },
      },

      {
        headers: getHeaders(),
      },
    );

    console.log("✅ Text message sent to:", to);
  } catch (error) {
    console.error(
      "❌ Text Message Error:",
      error.response?.data || error.message,
    );
  }
};
