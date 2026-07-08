import axios from "axios";

/* =====================================================
   CONFIG
===================================================== */

const BASE_URL = "https://vidyadigitalstudio.com";

const WA_URL = `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
});


/* =====================================================
   DATA
===================================================== */

const SERVICE_LINKS = {
  service_logo_branding: `${BASE_URL}/services/logo-branding`,
  service_social_media: `${BASE_URL}/services/social-media`,
  service_performance: `${BASE_URL}/services/performance-marketing`,
  service_marketplace: `${BASE_URL}/services/marketplace`,
  service_tech: `${BASE_URL}/services/tech-solutions`,
};


const WORK_LINKS = {
  work_branding: `${BASE_URL}/work/branding`,
  work_social_media: `${BASE_URL}/work/social-media`,
  work_techfolio: `${BASE_URL}/work/techfolio`,
};


const INSTAGRAM_URL =
  "https://www.instagram.com/vidyadigitalstudio/";


/* =====================================================
   INTENT DETECTION
===================================================== */

const isGreetingOrInterest = (text = "") => {
  const normalizedText = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "");


  const exactTriggers = [
    "hello",
    "hi",
    "hii",
    "hiii",
    "hey",
    "heyy",
    "hello there",
    "good morning",
    "good afternoon",
    "good evening",
  ];


  const interestTriggers = [
    "interested",
    "intrested",
    "i am interested",
    "i am intrested",
    "im interested",
    "im intrested",
    "i want to know more",
    "want to know more",
    "tell me more",
    "need more information",
    "need information",
    "want details",
    "need details",
    "what do you do",
    "what services do you provide",
    "services",
    "help",
  ];


  if (exactTriggers.includes(normalizedText)) {
    return true;
  }


  return interestTriggers.some((trigger) =>
    normalizedText.includes(trigger),
  );
};


/* =====================================================
   PROCESS INCOMING MESSAGE
===================================================== */

export const processMessage = async (body) => {
  try {
    const value =
      body.entry?.[0]?.changes?.[0]?.value;

    const message =
      value?.messages?.[0];


    if (!message) {
      console.log(
        "ℹ️ Webhook received without a user message",
      );

      return;
    }


    const from = message.from;

    const text =
      message?.text?.body?.trim() || "";

    const buttonReply =
      message?.interactive?.button_reply?.id;

    const listReply =
      message?.interactive?.list_reply?.id;


    console.log("\n================================");
    console.log("📩 NEW WHATSAPP MESSAGE");
    console.log("FROM:", from);
    console.log("TYPE:", message.type);
    console.log("TEXT:", text);
    console.log("BUTTON:", buttonReply);
    console.log("LIST:", listReply);
    console.log("================================\n");


    /* =============================================
       TEXT MESSAGE
    ============================================= */

    if (text) {
      if (isGreetingOrInterest(text)) {
        await sendMainMenu(from);
        return;
      }


      // Optional direct keyword shortcuts

      const normalizedText = text.toLowerCase();


      if (
        normalizedText.includes("service") ||
        normalizedText.includes("what do you do")
      ) {
        await sendServicesMenu(from);
        return;
      }


      if (
        normalizedText.includes("portfolio") ||
        normalizedText.includes("work") ||
        normalizedText.includes("projects")
      ) {
        await sendWorkMenu(from);
        return;
      }


      if (
        normalizedText.includes("collab") ||
        normalizedText.includes("collaborate") ||
        normalizedText.includes("partnership")
      ) {
        await sendCollabOptions(from);
        return;
      }
    }


    /* =============================================
       BUTTON REPLY
    ============================================= */

    if (buttonReply) {
      await handleButtonReply(from, buttonReply);
      return;
    }


    /* =============================================
       LIST REPLY
    ============================================= */

    if (listReply) {
      await handleListReply(from, listReply);
      return;
    }


    /* =============================================
       FALLBACK
    ============================================= */

    await sendFallbackMessage(from);

  } catch (error) {
    console.error(
      "❌ processMessage Error:",
      error.response?.data || error.message,
    );
  }
};


/* =====================================================
   BUTTON HANDLER
===================================================== */

const handleButtonReply = async (
  from,
  buttonReply,
) => {

  switch (buttonReply) {

    case "explore_services":
      await sendServicesMenu(from);
      break;


    case "view_work":
      await sendWorkMenu(from);
      break;


    case "collab_with_us":
      await sendCollabOptions(from);
      break;


    case "back_main_menu":
      await sendMainMenu(from);
      break;


    default:
      console.log(
        "⚠️ Unknown button reply:",
        buttonReply,
      );

      await sendMainMenu(from);
  }
};


/* =====================================================
   LIST HANDLER
===================================================== */

const handleListReply = async (
  from,
  listReply,
) => {

  /* ---------------- SERVICE LINKS ---------------- */

  if (SERVICE_LINKS[listReply]) {

    const serviceNames = {
      service_logo_branding:
        "Logo & Visual Identities",

      service_social_media:
        "Social Media Management",

      service_performance:
        "Performance Marketing",

      service_marketplace:
        "Marketplace Management",

      service_tech:
        "Tech Solutions",
    };


    await sendLinkMessage(
      from,
      serviceNames[listReply],
      SERVICE_LINKS[listReply],
      "Explore the service, understand our process, and see how we can help your brand.",
    );

    return;
  }


  /* ---------------- WORK LINKS ---------------- */

  if (WORK_LINKS[listReply]) {

    const workNames = {
      work_branding:
        "Branding & Design",

      work_social_media:
        "Social Media Management",

      work_techfolio:
        "Techfolio",
    };


    await sendLinkMessage(
      from,
      workNames[listReply],
      WORK_LINKS[listReply],
      "Take a look at some of the work we've created for brands and businesses.",
    );

    return;
  }


  console.log(
    "⚠️ Unknown list reply:",
    listReply,
  );


  await sendMainMenu(from);
};


/* =====================================================
   MAIN MENU
===================================================== */

const sendMainMenu = async (to) => {

  const payload = {
    messaging_product: "whatsapp",

    to,

    type: "interactive",

    interactive: {

      type: "button",

      body: {
        text:
          `Hey there 👋\n\n` +
          `Welcome to *Vidya Digital Studio*.\n\n` +
          `We help brands build strong identities, grow their digital presence, and create powerful digital experiences.\n\n` +
          `What would you like to explore?`,
      },

      footer: {
        text: "Design • Marketing • Technology",
      },

      action: {

        buttons: [

          {
            type: "reply",

            reply: {
              id: "explore_services",
              title: "Explore Services",
            },
          },

          {
            type: "reply",

            reply: {
              id: "view_work",
              title: "View Our Work",
            },
          },

          {
            type: "reply",

            reply: {
              id: "collab_with_us",
              title: "Collab With Us",
            },
          },

        ],
      },
    },
  };


  await sendWhatsAppRequest(
    payload,
    "Main menu",
  );
};


/* =====================================================
   SERVICES MENU
===================================================== */

const sendServicesMenu = async (to) => {

  const payload = {

    messaging_product: "whatsapp",

    to,

    type: "interactive",

    interactive: {

      type: "list",

      header: {
        type: "text",
        text: "Our Services",
      },

      body: {
        text:
          `From building a brand identity to scaling its digital presence — we've got you covered. 🚀\n\n` +
          `Select a service to learn more:`,
      },

      footer: {
        text: "Vidya Digital Studio",
      },

      action: {

        button: "Explore Services",

        sections: [

          {
            title: "Creative & Branding",

            rows: [

              {
                id: "service_logo_branding",
                title: "Logo & Visual Identity",
                description:
                  "Brand identity and visual systems",
              },

              {
                id: "service_social_media",
                title: "Social Media",
                description:
                  "Strategy, content and management",
              },

            ],
          },


          {
            title: "Growth & Technology",

            rows: [

              {
                id: "service_performance",
                title: "Performance Marketing",
                description:
                  "Data-driven campaigns for growth",
              },

              {
                id: "service_marketplace",
                title: "Marketplace Management",
                description:
                  "Manage and grow online marketplaces",
              },

              {
                id: "service_tech",
                title: "Tech Solutions",
                description:
                  "Websites, apps and digital products",
              },

            ],
          },

        ],
      },
    },
  };


  await sendWhatsAppRequest(
    payload,
    "Services menu",
  );
};


/* =====================================================
   WORK MENU
===================================================== */

const sendWorkMenu = async (to) => {

  const payload = {

    messaging_product: "whatsapp",

    to,

    type: "interactive",

    interactive: {

      type: "list",

      header: {
        type: "text",
        text: "Our Work",
      },

      body: {
        text:
          `Ideas are great. Execution makes the difference. ✨\n\n` +
          `Explore some of our selected work:`,
      },

      footer: {
        text: "Built with strategy and creativity",
      },

      action: {

        button: "Explore Our Work",

        sections: [

          {
            title: "Selected Work",

            rows: [

              {
                id: "work_branding",
                title: "Branding & Design",
                description:
                  "Brand identities and creative design",
              },

              {
                id: "work_social_media",
                title: "Social Media",
                description:
                  "Campaigns, content and brand growth",
              },

              {
                id: "work_techfolio",
                title: "Techfolio",
                description:
                  "Websites, apps and digital experiences",
              },

            ],
          },

        ],
      },
    },
  };


  await sendWhatsAppRequest(
    payload,
    "Work menu",
  );
};


/* =====================================================
   COLLAB WITH US
===================================================== */

const sendCollabOptions = async (to) => {

  await sendTextMessage(

    to,

    `Let's create something great together. 🤝✨\n\n` +

    `Whether you're a brand, creator, agency, freelancer, or someone with an exciting idea — we'd love to hear from you.\n\n` +

    `💬 DM us on Instagram:\n${INSTAGRAM_URL}\n\n` +

    `Tell us a little about your idea and our team will get back to you.`

  );
};


/* =====================================================
   LINK MESSAGE
===================================================== */

const sendLinkMessage = async (
  to,
  title,
  url,
  description,
) => {

  await sendTextMessage(

    to,

    `✨ *${title}*\n\n` +

    `${description}\n\n` +

    `🔗 Explore here:\n${url}\n\n` +

    `Have questions? Just reply *Hello* anytime to return to the main menu.`

  );
};


/* =====================================================
   FALLBACK MESSAGE
===================================================== */

const sendFallbackMessage = async (to) => {

  await sendTextMessage(

    to,

    `Hey 👋\n\n` +

    `I couldn't quite understand that message.\n\n` +

    `You can type *Hello* to explore:\n\n` +

    `🎨 Our Services\n` +

    `🚀 Our Work\n` +

    `🤝 Collaboration Opportunities`

  );
};


/* =====================================================
   GENERIC TEXT MESSAGE
===================================================== */

const sendTextMessage = async (
  to,
  message,
) => {

  const payload = {

    messaging_product: "whatsapp",

    to,

    type: "text",

    text: {
      preview_url: true,
      body: message,
    },
  };


  await sendWhatsAppRequest(
    payload,
    "Text message",
  );
};


/* =====================================================
   CENTRAL WHATSAPP API REQUEST
===================================================== */

const sendWhatsAppRequest = async (
  payload,
  label = "WhatsApp message",
) => {

  try {

    const response = await axios.post(
      WA_URL,
      payload,
      {
        headers: getHeaders(),
      },
    );


    console.log(
      `✅ ${label} sent successfully to:`,
      payload.to,
    );


    return response.data;

  } catch (error) {

    console.error(
      `❌ ${label} Error:`,
      error.response?.data || error.message,
    );


    throw error;
  }
};