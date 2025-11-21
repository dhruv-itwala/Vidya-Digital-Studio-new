// services/Pdf.service.js
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import ejs from "ejs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 MAX PERFORMANCE SETTINGS
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false; // skip GPU rasterization

/**
 * Paginate rows by measuring heights
 */
async function paginateRowsByHeight(page, items, css) {
  await page.setViewport({
    width: 794,
    height: 1122,
    deviceScaleFactor: 1,
  });

  const tempHTML = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
${css}
body { margin:0; padding:0; box-sizing:border-box; }
.main-content { margin-top: calc(var(--top-offset)); padding: 0 20px; }
.page-body { padding:0; }
.items-table { width:100%; border-collapse:collapse; table-layout:fixed; }
.items-table td, .items-table th {
  padding:12px;
  font-size:16px;
  vertical-align:top;
  border:1px solid #000;
  word-break:break-word;
}
ul { margin:0; padding-left:16px; }
</style>
</head>
<body>
<main class="main-content">
  <div class="page-body">
    <table class="items-table">
      <tbody>
        ${items
          .map((i) => {
            const descHtml = Array.isArray(i.description)
              ? "<ul>" +
                i.description.map((d) => `<li>${escapeHtml(d)}</li>`).join("") +
                "</ul>"
              : escapeHtml(i.description || "-");

            return `
              <tr>
                <td>${escapeHtml(i.category || "")}</td>
                <td>${escapeHtml(i.service || "")}</td>
                <td>${descHtml}</td>
                <td style="text-align:center">${escapeHtml(
                  String(i.quantity || "-")
                )}</td>
                <td style="text-align:center">${escapeHtml(
                  String(i.total || 0)
                )}</td>
              </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  </div>
</main>
</body>
</html>`;

  // ⚡ fastest load
  await page.setContent(tempHTML, { waitUntil: "domcontentloaded" });

  const rowHeights = await page.evaluate(() =>
    Array.from(document.querySelectorAll("tr")).map((tr) => tr.offsetHeight)
  );

  const MAX_FIRST = 460;
  const MAX_NEXT = 560;

  let pages = [];
  let current = [];
  let height = 0;
  let limit = MAX_FIRST;

  items.forEach((item, idx) => {
    const h = rowHeights[idx] || 28;

    if (height + h > limit) {
      pages.push(current);
      current = [item];
      height = h;
      if (pages.length === 1) limit = MAX_NEXT;
    } else {
      current.push(item);
      height += h;
    }
  });

  if (current.length) pages.push(current);
  return pages;
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const generateQuotePdfBuffer = async ({
  client = {},
  items = [],
  notes = [],
  duration,
  isAdmin,
  isApproved,
}) => {
  try {
    const templatePath = path.join(__dirname, "../templates/quoteTemplate.ejs");
    const cssPath = path.join(__dirname, "../templates/pdf-styles.css");

    const css = fs.readFileSync(cssPath, "utf8");

    // 🚀 MAXIMUM SPEED LAUNCH CONFIG (no compromise in output)
    // const browser = await puppeteer.launch({
    //   args: [
    //     ...chromium.args,
    //     "--disable-webgl",
    //     "--disable-extensions",
    //     "--disable-dev-shm-usage",
    //     "--disable-setuid-sandbox",
    //     "--disable-gpu",
    //     "--no-sandbox",
    //     "--no-zygote",
    //     "--single-process",
    //     "--ignore-gpu-blacklist",
    //     "--disable-software-rasterizer",
    //     "--font-render-hinting=none", // boost performance slightly
    //     "--disable-features=IsolateOrigins,site-per-process",
    //   ],
    //   defaultViewport: { width: 794, height: 1122 },
    //   executablePath: await chromium.executablePath(),
    //   headless: chromium.headless,
    // });

    let browser;

    if (process.platform === "win32") {
      // Running locally on Windows → use normal Puppeteer
      const localPuppeteer = await import("puppeteer");
      browser = await localPuppeteer.default.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    } else {
      // Running on Render (Linux) → use puppeteer-core + sparticuz chromium
      browser = await puppeteer.launch({
        args: [
          ...chromium.args,
          "--disable-webgl",
          "--disable-extensions",
          "--disable-dev-shm-usage",
          "--disable-setuid-sandbox",
          "--disable-gpu",
          "--no-sandbox",
          "--no-zygote",
          "--single-process",
          "--ignore-gpu-blacklist",
          "--disable-software-rasterizer",
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    }

    const measurementPage = await browser.newPage();
    const pages = await paginateRowsByHeight(measurementPage, items, css);
    await measurementPage.close();

    const subtotal = items.reduce((t, i) => t + (Number(i.total) || 0), 0);

    const defaultNotes = [
      "This quotation is system-generated and does not represent any legal, contractual, or official commitment.",
      "The prices and services mentioned are subject to change.",
      "This document is issued for estimation and discussion only.",
      "Vidya Digital Studio reserves the right to modify terms before contract.",
    ];

    const isAdminBool = ["true", true, "1", 1].includes(isAdmin);

    const finalNotes = isAdminBool
      ? [...(Array.isArray(notes) ? notes : [])]
      : [...defaultNotes, ...(Array.isArray(notes) ? notes : [])];

    const html = await ejs.renderFile(templatePath, {
      client,
      items,
      pages,
      subtotal,
      notes: finalNotes,
      duration,
      css,
      isApproved,
      isAdmin: isAdminBool,
      logoUrl:
        "https://res.cloudinary.com/dmt7dysjh/image/upload/v1763035703/jtvl8nd5iux8lv3lhvvb.png",
      signatureUrl:
        "https://res.cloudinary.com/dmt7dysjh/image/upload/v1763035703/zvxeqdgxgolw6mwwydko.png",
      watermarkUrl:
        "https://res.cloudinary.com/dmt7dysjh/image/upload/v1763035782/su3nyob2kedbc9k7swb2.png",
    });

    const page = await browser.newPage();

    // ⚡ Ultra-fast content rendering
    await page.setContent(html, { waitUntil: "networkidle0" });

    // 🎯 FINAL PDF (no visual compromise)
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      timeout: 0,
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (err) {
    console.error("PDF Generation Error:", err);
    throw err;
  }
};
