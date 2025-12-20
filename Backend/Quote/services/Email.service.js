// services/email.service.js
import path from "path";
import ejs from "ejs";
import { fileURLToPath } from "url";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FROM_EMAIL = process.env.FROM_EMAIL || "contact@vidyadigitalstudio.com";
/* -------------------- Load EJS Email Template -------------------- */
async function renderEmailTemplate(templateName, data = {}) {
  const templatePath = path.join(__dirname, `../templates/${templateName}.ejs`);
  return await ejs.renderFile(templatePath, data);
}

/* -------------------- Send Email using Resend API -------------------- */
export async function sendEmailTemplate({ to, subject, templateName, data }) {
  const html = await renderEmailTemplate(templateName, data);

  const response = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    cc: "contact@vidyadigitalstudio.com",
    subject,
    html,
  });

  return response;
}
