// Backend/Invoice/services/Pdf.service.js
import fs from "fs";
import path from "path";
import os from "os";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import ejs from "ejs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

let cachedBrowser = null;

const getChromeExecutablePath = () => {
  const possiblePaths = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
};

const getBrowserInstance = async () => {
  if (cachedBrowser) {
    try {
      if (cachedBrowser.isConnected()) return cachedBrowser;
    } catch (e) {
      console.log("[Invoice PDF] Cached browser disconnected. Launching new one...");
    }
  }

  const uniqueProfileDir = path.join(
    os.tmpdir(),
    `puppeteer_invoice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );

  const defaultArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--no-zygote",
    "--single-process",
    "--disable-extensions",
    "--disable-software-rasterizer",
  ];

  if (process.platform === "win32") {
    const localPuppeteer = await import("puppeteer");
    const chromePath = getChromeExecutablePath();
    const launchOptions = {
      headless: true,
      userDataDir: uniqueProfileDir,
      args: defaultArgs,
    };
    if (chromePath) {
      launchOptions.executablePath = chromePath;
    }
    cachedBrowser = await localPuppeteer.default.launch(launchOptions);
  } else {
    let execPath;
    try {
      execPath = await chromium.executablePath();
    } catch (e) {
      execPath = getChromeExecutablePath();
    }

    cachedBrowser = await puppeteer.launch({
      args: [...(chromium.args || []), ...defaultArgs],
      defaultViewport: chromium.defaultViewport,
      executablePath: execPath,
      userDataDir: uniqueProfileDir,
      headless: true,
    });
  }

  cachedBrowser.on("disconnected", () => {
    console.log("[Invoice PDF] Browser disconnected. Clearing cache.");
    cachedBrowser = null;
  });

  return cachedBrowser;
};

export const closeBrowserInstance = async () => {
  if (cachedBrowser) {
    try {
      await cachedBrowser.close();
    } catch (e) {}
    cachedBrowser = null;
  }
};

// Helper to get QR Code Data URI
const getQrCodeDataUri = () => {
  const possiblePaths = [
    path.join(__dirname, "../assets/PaymentQrCode.png"),
    path.resolve(process.cwd(), "Invoice/assets/PaymentQrCode.png"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const fileBuffer = fs.readFileSync(p);
        return `data:image/png;base64,${fileBuffer.toString("base64")}`;
      } catch (err) {
        console.error("[Invoice PDF] Error reading QR file:", p, err);
      }
    }
  }
  return "";
};

export const generateInvoicePdfBuffer = async ({
  invoiceNumber = "IND/2026 : #1001",
  invoiceDate = "30TH OCT, 2026",
  client = {},
  items = [],
  gstEnabled = false,
  subtotal = 0,
  cgst = 0,
  sgst = 0,
  totalAmount = 0,
  advanceAmount = 0,
  remainingAmount = 0,
  remainingDate = "",
  paymentTerms = [],
  notes = [],
  bankDetails = {},
}) => {
  console.time("Invoice PDF | Total Duration");

  try {
    const templatePath = path.join(__dirname, "../templates/invoiceTemplate.ejs");
    const cssPath = path.join(__dirname, "../templates/invoice-styles.css");

    const css = fs.readFileSync(cssPath, "utf8");
    const qrCodeDataUri = getQrCodeDataUri();

    const defaultPaymentTerms = [
      "Payment is due within 3 days of the invoice date.",
      "Services will be delivered as per the mutually agreed scope of work and timeline.",
      "Any additional work, features or revisions beyond the agreed scope will be charged separately.",
      "Delays in receiving required content, approvals or feedback from the client may affect delivery timelines.",
      "Advertising (ad spend) costs are not included in this invoice and will be billed separately, if applicable.",
      "Third-party resources, subscriptions, plugins, software or add-ons are not included and will be billed separately, if applicable.",
      "Delayed payments may result in a temporary pause or suspension of services.",
      "The agency is not responsible for delays or disruptions caused by third-party platforms or external service providers.",
      "Final deliverables and ownership rights will be transferred as per the agreed project terms and applicable payment conditions.",
      "Specific business results, sales, leads, rankings or engagement levels are not guaranteed unless explicitly agreed in writing.",
    ];

    const finalPaymentTerms =
      paymentTerms && paymentTerms.length > 0 ? paymentTerms : defaultPaymentTerms;

    const finalBankDetails = {
      bankName: bankDetails.bankName || "Union Bank of India",
      accountHolderName:
        bankDetails.accountHolderName || "Dheemahi Arkeshbhai Joshi",
      accountNumber: bankDetails.accountNumber || "534202010030024",
      ifscCode: bankDetails.ifscCode || "UBIN0553425",
      upiId: bankDetails.upiId || "dheemahi2@okhdfcbank",
    };

    const parsedNotes = Array.isArray(notes)
      ? notes.filter((n) => n && n.trim().length > 0)
      : typeof notes === "string" && notes.trim()
      ? notes.split("\n").map((n) => n.trim()).filter(Boolean)
      : [];

    const browser = await getBrowserInstance();
    const page = await browser.newPage();

    const html = await ejs.renderFile(templatePath, {
      invoiceNumber,
      invoiceDate,
      client,
      items,
      gstEnabled: !!gstEnabled,
      subtotal,
      cgst,
      sgst,
      totalAmount,
      advanceAmount,
      remainingAmount,
      remainingDate,
      paymentTerms: finalPaymentTerms,
      notes: parsedNotes,
      bankDetails: finalBankDetails,
      css,
      qrCodeDataUri,
      logoUrl:
        "https://res.cloudinary.com/dmt7dysjh/image/upload/v1763035703/jtvl8nd5iux8lv3lhvvb.png",
      signatureUrl:
        "https://res.cloudinary.com/dmt7dysjh/image/upload/v1763035703/zvxeqdgxgolw6mwwydko.png",
      watermarkUrl:
        "https://res.cloudinary.com/dmt7dysjh/image/upload/v1763035782/su3nyob2kedbc9k7swb2.png",
    });

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      timeout: 0,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });

    await page.close();
    console.timeEnd("Invoice PDF | Total Duration");

    return Buffer.from(pdfBuffer);
  } catch (err) {
    console.timeEnd("Invoice PDF | Total Duration");
    console.error("[Invoice PDF] Generation Error:", err);
    throw err;
  }
};
