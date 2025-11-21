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

/* -------------------- Send Email using Resend SMTP -------------------- */
export async function sendEmailTemplate({ to, subject, templateName, data }) {
  const html = await renderEmailTemplate(templateName, data);

  const transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 587,
    secure: false,
    auth: {
      user: "resend",
      pass: process.env.RESEND_API_KEY,
    },
    tls: {
      rejectUnauthorized: false, // avoid TLS issues on Render / Railway
    },
  });

  return await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}
