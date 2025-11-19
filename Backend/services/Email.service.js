// services/email.service.js
import path from "path";
import ejs from "ejs";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FROM_EMAIL = process.env.FROM_EMAIL || "contact@vidyadigitalstudio.com";

/* -------------------- Load EJS Email Template -------------------- */
async function renderEmailTemplate(templateName, data = {}) {
  const templatePath = path.join(__dirname, `../templates/${templateName}.ejs`);

  return await ejs.renderFile(templatePath, data);
}

/* -------------------- Send Email via Nodemailer (Only) -------------------- */
export async function sendEmailTemplate({ to, subject, templateName, data }) {
  const html = await renderEmailTemplate(templateName, data);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}
