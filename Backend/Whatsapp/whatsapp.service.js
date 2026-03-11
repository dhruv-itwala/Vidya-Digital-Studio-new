import axios from "axios";

export const processMessage = async (body) => {
  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message) return;

  const from = message.from;

  const text = message?.text?.body?.toLowerCase?.();
  const buttonReply = message?.interactive?.button_reply?.id;
  const listReply = message?.interactive?.list_reply?.id;

  console.log("Incoming:", text || buttonReply || listReply);

  // Step 1: User says hello
  if (text && text.includes("hello")) {
    await sendServiceMenu(from);
    return;
  }

  // Step 2: Service selected
  if (listReply) {
    await sendServiceOptions(from, listReply);
    return;
  }

  // Step 3: Button clicked
  if (buttonReply) {
    if (buttonReply === "get_call") {
      await sendContactRedirect(from);
    }
  }
};

/* ---------------- SERVICE MENU ---------------- */

const sendServiceMenu = async (to) => {
  try {
    await axios.post(
      `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "list",
          body: {
            text: "Hello 👋\n\nHow can Vidya Digital Studio help you?\nPlease select the service you want:",
          },
          action: {
            button: "Select Service",
            sections: [
              {
                title: "Our Services",
                rows: [
                  {
                    id: "graphic_design",
                    title: "Graphic & UI/UX Design",
                  },
                  {
                    id: "media_production",
                    title: "Media Production & Distribution",
                  },
                  {
                    id: "web_app",
                    title: "Web & App Development",
                  },
                  {
                    id: "video_editing",
                    title: "Video Editing",
                  },
                  {
                    id: "3d_modelling",
                    title: "3D Modelling",
                  },
                ],
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

    console.log("Service menu sent");
  } catch (error) {
    console.error(error.response?.data || error);
  }
};

/* ---------------- SERVICE OPTIONS ---------------- */

const sendServiceOptions = async (to, service) => {
  const links = {
    graphic_design: "https://vidyadigitalstudio.com/projects/graphic-designing",

    media_production:
      "https://vidyadigitalstudio.com/projects/social-media-management",

    web_app: "https://vidyadigitalstudio.com/projects/web-and-app",

    video_editing: "https://vidyadigitalstudio.com/projects/video-editing",

    "3d_modelling": "https://vidyadigitalstudio.com/projects/3d-modelling",
  };

  const projectLink = links[service];

  try {
    await axios.post(
      `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: `Great choice 👍\n\nYou can view our work or request a call.`,
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: "view_work",
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
        headers: {
          Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    // Store project link temporarily
    global.projectLink = projectLink;

    console.log("Options sent");
  } catch (error) {
    console.error(error.response?.data || error);
  }
};

/* ---------------- CONTACT / VIEW WORK ---------------- */

const sendContactRedirect = async (to) => {
  try {
    await axios.post(
      `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: `Our expert will contact you shortly 📞\n\nYou can also request a call here:\nhttps://vidyadigitalstudio.com/contact-us`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error(error.response?.data || error);
  }
};
