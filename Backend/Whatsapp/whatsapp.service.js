import axios from "axios";
import User from "../StaffCRM/Users/user.model.js";
import Lead from "../StaffCRM/Leads/Lead.model.js";
import { createLeadService } from "../StaffCRM/Leads/Lead.service.js";
import { logActivity } from "../StaffCRM/AuditLog/AuditLog.service.js";
import WhatsappMessage from "./WhatsappMessage.model.js";

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
   STAFF IDENTIFICATION & CRM HELPERS
===================================================== */

const getStaffUserByPhone = async (from = "") => {
  if (!from) return null;
  const digitsOnly = from.replace(/\D/g, "");
  const last10 = digitsOnly.slice(-10);

  return User.findOne({
    $or: [{ phone: last10 }, { phone: digitsOnly }],
    isActive: true,
  });
};

const parseLeadSubmission = (text = "") => {
  const getField = (patterns) => {
    for (const pat of patterns) {
      const regex = new RegExp(`(?:^|\\n)\\s*\\*?${pat}\\*?\\s*[:=-]\\s*(.+)`, "i");
      const match = text.match(regex);
      if (match && match[1]) {
        return match[1].trim().replace(/^\*|\*$/g, "").trim();
      }
    }
    return null;
  };

  const clientName = getField(["ClientName", "Client Name", "Client"]);
  const ownerName = getField(["OwnerName", "Owner Name", "Owner"]);
  const phone = getField(["Phone", "Phone Number", "Mobile", "Contact"]);
  const email = getField(["Email", "Email Address", "Mail"]);
  const servicesStr = getField(["Services", "Service"]);
  const revenueStr = getField(["ExpectedRevenue", "Expected Revenue", "Revenue", "Value", "Budget"]);
  const notes = getField(["Notes", "Note", "Remarks", "Remark"]);

  const services = servicesStr
    ? servicesStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const expectedRevenue = revenueStr
    ? Number(revenueStr.replace(/[^0-9.]/g, "")) || 0
    : 0;

  return {
    clientName,
    ownerName,
    phone,
    email,
    services,
    expectedRevenue,
    notes,
  };
};

const isLeadSubmission = (text = "") => {
  const lower = text.toLowerCase();
  return (
    lower.includes("clientname:") ||
    lower.includes("client name:") ||
    lower.includes("clientname :") ||
    lower.includes("client name :") ||
    (lower.includes("add lead") && (lower.includes("client") || lower.includes("phone")))
  );
};

/* =====================================================
   LEAD CRM ACTIONS
===================================================== */

const sendLeadMenu = async (to, staffUser) => {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text:
          `👋 Hello *${staffUser.name}*!\n\n` +
          `Welcome to *VDS CRM Lead Management*.\n\n` +
          `Please select an option below:`,
      },
      footer: {
        text: "Vidya Digital Studio CRM",
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "lead_show",
              title: "Show leads",
            },
          },
          {
            type: "reply",
            reply: {
              id: "lead_add",
              title: "Add leads",
            },
          },
        ],
      },
    },
  };

  await sendWhatsAppRequest(payload, "Lead menu");
};

const handleShowLeads = async (to, staffUser) => {
  try {
    const leads = await Lead.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (!leads || leads.length === 0) {
      await sendTextMessage(to, "ℹ️ No leads found in the system.");
      return;
    }

    let message = `📋 *LATEST LEADS (${leads.length})*\n\n`;

    leads.forEach((l, index) => {
      message += `*${index + 1}. ${l.clientName}*\n`;
      if (l.ownerName) message += `👤 Owner: ${l.ownerName}\n`;
      message += `📞 Phone: ${l.phone || "N/A"}\n`;
      if (l.email) message += `✉️ Email: ${l.email}\n`;
      message += `📊 Status: ${l.status || "Raw Lead"}\n`;
      if (l.expectedRevenue) {
        message += `💰 Revenue: ₹${Number(l.expectedRevenue).toLocaleString("en-IN")}\n`;
      }
      if (l.services && l.services.length > 0) {
        message += `🛠️ Services: ${l.services.join(", ")}\n`;
      }
      message += `\n`;
    });

    message += `_Send *LEAD* anytime to manage leads or add a new lead._`;

    await sendTextMessage(to, message);
  } catch (error) {
    console.error("❌ handleShowLeads Error:", error);
    await sendTextMessage(to, "⚠️ Failed to fetch leads. Please try again.");
  }
};

const sendAddLeadFormat = async (to) => {
  const formatText =
    `📝 *ADD LEAD FORMAT*\n\n` +
    `_Copy the text below, fill in the values after the colons, and send it back:_ 👇\n\n` +
    `ClientName: \n` +
    `OwnerName: \n` +
    `Phone: \n` +
    `Email: \n` +
    `Services: \n` +
    `ExpectedRevenue: \n` +
    `Notes: `;

  await sendTextMessage(to, formatText);
};

const handleLeadSubmission = async (from, text, staffUser) => {
  try {
    const parsed = parseLeadSubmission(text);

    if (!parsed.clientName) {
      await sendTextMessage(
        from,
        `❌ *ClientName is required!*\n\nPlease provide at least the client name after \`ClientName:\` and send again.`
      );
      return;
    }

    const leadPayload = {
      clientName: parsed.clientName,
      ownerName: parsed.ownerName || undefined,
      phone: parsed.phone || undefined,
      email: parsed.email || undefined,
      services: parsed.services,
      expectedRevenue: parsed.expectedRevenue || 0,
      notes: parsed.notes || undefined,
    };

    const lead = await createLeadService(leadPayload, staffUser._id);

    try {
      logActivity({
        user: staffUser,
        category: "CRM",
        module: "Leads",
        action: "CREATE",
        entityId: lead._id,
        entityName: lead.clientName,
        description: `${staffUser.name} created Lead '${lead.clientName}' via WhatsApp`,
      });
    } catch (err) {
      console.warn("Audit log notice:", err.message);
    }

    let responseMsg = `✅ *Lead Added Successfully!*\n\n`;
    responseMsg += `🏢 *Client:* ${lead.clientName}\n`;
    if (lead.ownerName) responseMsg += `👤 *Owner:* ${lead.ownerName}\n`;
    if (lead.phone) responseMsg += `📞 *Phone:* ${lead.phone}\n`;
    if (lead.email) responseMsg += `✉️ *Email:* ${lead.email}\n`;
    if (lead.expectedRevenue) {
      responseMsg += `💰 *Revenue:* ₹${Number(lead.expectedRevenue).toLocaleString("en-IN")}\n`;
    }
    if (lead.services && lead.services.length > 0) {
      responseMsg += `🛠️ *Services:* ${lead.services.join(", ")}\n`;
    }
    responseMsg += `📊 *Status:* ${lead.status}\n`;
    responseMsg += `👤 *Added By:* ${staffUser.name} (${staffUser.role})\n\n`;
    responseMsg += `_Send *LEAD* anytime to view all leads or add another._`;

    await sendTextMessage(from, responseMsg);
  } catch (error) {
    console.error("❌ handleLeadSubmission Error:", error);
    const errorMsg = error.message || "Failed to create lead.";
    await sendTextMessage(from, `⚠️ *Could not save lead:*\n${errorMsg}`);
  }
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

    // Save inbound message to conversation history
    await saveInboundMessage({
      from,
      text,
      buttonReply,
      listReply,
      messageType: message.type,
      profileName: value?.contacts?.[0]?.profile?.name,
    });


    /* =============================================
       TEXT MESSAGE
    ============================================= */

    if (text) {
      const normalizedText = text.toLowerCase().trim();

      /* ---------------- LEAD MANAGEMENT (STAFF CRM) ---------------- */

      // 1. Check if user is submitting filled "Add Lead" format
      if (isLeadSubmission(text)) {
        const staffUser = await getStaffUserByPhone(from);
        if (!staffUser) {
          await sendTextMessage(
            from,
            "🔒 *Access Restricted*\n\nYou must be a registered team member to submit leads.",
          );
          return;
        }
        await handleLeadSubmission(from, text, staffUser);
        return;
      }

      // 2. Check for "LEAD" trigger
      if (
        normalizedText === "lead" ||
        normalizedText === "leads" ||
        normalizedText === "#lead" ||
        normalizedText === "/lead"
      ) {
        const staffUser = await getStaffUserByPhone(from);
        if (!staffUser) {
          await sendTextMessage(
            from,
            "🔒 *Access Restricted*\n\nLead management is only accessible to registered VDS staff members. Your phone number is not linked to an active staff account.",
          );
          return;
        }
        await sendLeadMenu(from, staffUser);
        return;
      }

      // 3. Text shortcuts for "Show leads" or "Add leads"
      if (/^(show\s*leads?|view\s*leads?)$/i.test(normalizedText)) {
        const staffUser = await getStaffUserByPhone(from);
        if (!staffUser) {
          await sendTextMessage(
            from,
            "🔒 *Access Restricted*\n\nLead management is only accessible to authorized team members.",
          );
          return;
        }
        await handleShowLeads(from, staffUser);
        return;
      }

      if (/^(add\s*leads?|new\s*lead)$/i.test(normalizedText)) {
        const staffUser = await getStaffUserByPhone(from);
        if (!staffUser) {
          await sendTextMessage(
            from,
            "🔒 *Access Restricted*\n\nLead management is only accessible to authorized team members.",
          );
          return;
        }
        await sendAddLeadFormat(from);
        return;
      }

      /* ---------------- CLIENT WORKFLOW ---------------- */

      if (isGreetingOrInterest(text)) {
        await sendMainMenu(from);
        return;
      }


      // Optional direct keyword shortcuts

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

    case "lead_show": {
      const staffUser = await getStaffUserByPhone(from);
      if (!staffUser) {
        await sendTextMessage(
          from,
          "🔒 *Access Restricted*\n\nLead management is only accessible to authorized team members.",
        );
        break;
      }
      await handleShowLeads(from, staffUser);
      break;
    }


    case "lead_add": {
      const staffUser = await getStaffUserByPhone(from);
      if (!staffUser) {
        await sendTextMessage(
          from,
          "🔒 *Access Restricted*\n\nLead management is only accessible to authorized team members.",
        );
        break;
      }
      await sendAddLeadFormat(from);
      break;
    }


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

    // Save outbound message to conversation history
    await saveOutboundMessage(payload);

    return response.data;

  } catch (error) {

    console.error(
      `❌ ${label} Error:`,
      error.response?.data || error.message,
    );


    throw error;
  }
};


/* =====================================================
   CONVERSATION HISTORY PERSISTENCE & SERVICES
===================================================== */

const saveInboundMessage = async ({
  from,
  text,
  buttonReply,
  listReply,
  messageType,
  profileName,
}) => {
  try {
    let body = text;
    if (!body && buttonReply) {
      body = buttonReply === "lead_show"
        ? "📋 Show leads"
        : buttonReply === "lead_add"
        ? "➕ Add leads"
        : buttonReply;
    } else if (!body && listReply) {
      body = listReply;
    } else if (!body) {
      body = `[${messageType || "message"}]`;
    }

    const clean = from.replace(/\D/g, "");
    const last10 = clean.slice(-10);

    const [staffUser, lead] = await Promise.all([
      User.findOne({ $or: [{ phone: last10 }, { phone: clean }] }).select("_id name role"),
      Lead.findOne({ $or: [{ phone: last10 }, { phone: clean }] }).select("_id clientName"),
    ]);

    await WhatsappMessage.create({
      phone: from,
      from,
      to: process.env.WA_PHONE_NUMBER_ID || "VDS",
      direction: "inbound",
      type: messageType || "text",
      body,
      buttonReplyId: buttonReply,
      listReplyId: listReply,
      senderName: staffUser?.name || profileName || from,
      user: staffUser?._id,
      lead: lead?._id,
      status: "received",
    });
  } catch (err) {
    console.error("❌ Error saving inbound WhatsApp message:", err.message);
  }
};

const saveOutboundMessage = async (payload) => {
  try {
    const to = payload?.to;
    if (!to) return;

    let body = "";
    if (payload.type === "text") {
      body = payload.text?.body || "";
    } else if (payload.type === "interactive") {
      const mainText = payload.interactive?.body?.text || "";
      const buttons = payload.interactive?.action?.buttons
        ?.map((b) => b.reply?.title)
        .filter(Boolean)
        .join(" | ");
      body = buttons ? `${mainText}\n\n[Buttons: ${buttons}]` : mainText;
    } else {
      body = `[${payload.type || "message"}]`;
    }

    const clean = to.replace(/\D/g, "");
    const last10 = clean.slice(-10);

    const [staffUser, lead] = await Promise.all([
      User.findOne({ $or: [{ phone: last10 }, { phone: clean }] }).select("_id"),
      Lead.findOne({ $or: [{ phone: last10 }, { phone: clean }] }).select("_id"),
    ]);

    await WhatsappMessage.create({
      phone: to,
      from: "Vidya Digital Studio",
      to,
      direction: "outbound",
      type: payload.type || "text",
      body,
      user: staffUser?._id,
      lead: lead?._id,
      status: "sent",
    });
  } catch (err) {
    console.error("❌ Error saving outbound WhatsApp message:", err.message);
  }
};

export const getConversationsService = async () => {
  const conversations = await WhatsappMessage.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$phone",
        lastMessage: { $first: "$$ROOT" },
        messageCount: { $sum: 1 },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  const enriched = await Promise.all(
    conversations.map(async (c) => {
      const phone = c._id;
      const cleanPhone = phone.replace(/\D/g, "");
      const last10 = cleanPhone.slice(-10);

      const [staffUser, lead] = await Promise.all([
        User.findOne({
          $or: [{ phone: last10 }, { phone: cleanPhone }],
          isActive: true,
        })
          .select("name email phone role profilePicture designation")
          .lean(),
        Lead.findOne({
          $or: [{ phone: last10 }, { phone: cleanPhone }],
        })
          .select("clientName ownerName email phone status expectedRevenue")
          .lean(),
      ]);

      const displayName =
        staffUser?.name ||
        lead?.clientName ||
        c.lastMessage?.senderName ||
        phone;

      return {
        phone,
        lastMessage: c.lastMessage,
        messageCount: c.messageCount,
        staffUser: staffUser || null,
        lead: lead || null,
        name: displayName,
      };
    })
  );

  return enriched;
};

export const getConversationMessagesService = async (phone) => {
  if (!phone) return { phone, messages: [] };

  const clean = phone.replace(/\D/g, "");
  const last10 = clean.slice(-10);

  const messages = await WhatsappMessage.find({
    $or: [
      { phone },
      { phone: clean },
      { phone: { $regex: last10 + "$" } },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();

  const [staffUser, lead] = await Promise.all([
    User.findOne({
      $or: [{ phone: last10 }, { phone: clean }],
      isActive: true,
    })
      .select("name email phone role profilePicture designation")
      .lean(),
    Lead.findOne({
      $or: [{ phone: last10 }, { phone: clean }],
    })
      .select("clientName ownerName email phone status expectedRevenue services notes")
      .lean(),
  ]);

  return {
    phone,
    staffUser,
    lead,
    messages,
  };
};

export const sendManualMessageService = async (to, text, adminUser) => {
  if (!to || !text) {
    throw new Error("Phone number and text body are required");
  }

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      preview_url: true,
      body: text,
    },
  };

  const response = await sendWhatsAppRequest(
    payload,
    `Manual WhatsApp message by ${adminUser?.name || "Admin"}`
  );
  return response;
};