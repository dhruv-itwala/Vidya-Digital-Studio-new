// services/Pdf.service.js
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import ejs from "ejs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Properly handle bullet lists inside measurement page.
 */
async function paginateRowsByHeight(page, items, css) {
  await page.setViewport({ width: 794, height: 1122, deviceScaleFactor: 1 });

  const tempHTML = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
${css}

body { margin: 0; padding: 0; box-sizing: border-box; }
.main-content {
  margin-top: calc(var(--top-offset));
  padding-left: 20px;
  padding-right: 20px;
}
.page-body { padding: 0; }
.items-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.items-table td, .items-table th {
  padding: 12px;
  font-size: 16px;
  vertical-align: top;
  border: 1px solid #000;
  word-wrap: break-word;
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
                  i.description
                    .map((d) => `<li>${escapeHtml(d)}</li>`)
                    .join("") +
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

  await page.setContent(tempHTML, { waitUntil: "networkidle0" });

  await page.waitForSelector("tr");

  const rowHeights = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("tr")).map(
      (tr) => tr.offsetHeight
    );
  });

  const MAX_FIRST_PAGE_HEIGHT = 460;
  const MAX_OTHER_PAGE_HEIGHT = 560;

  let pages = [];
  let currentPage = [];
  let heightUsed = 0;
  let currentLimit = MAX_FIRST_PAGE_HEIGHT;

  items.forEach((item, index) => {
    const thisHeight = rowHeights[index] || 28;

    if (heightUsed + thisHeight > currentLimit) {
      pages.push(currentPage);
      currentPage = [item];
      heightUsed = thisHeight;

      if (pages.length === 1) {
        currentLimit = MAX_OTHER_PAGE_HEIGHT;
      }
    } else {
      currentPage.push(item);
      heightUsed += thisHeight;
    }
  });

  if (currentPage.length > 0) pages.push(currentPage);
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

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-features=IsolateOrigins",
        "--disable-site-isolation-trials",
      ],
    });

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

    const isAdminBool =
      isAdmin === true ||
      isAdmin === "true" ||
      isAdmin === 1 ||
      isAdmin === "1";

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

    const finalPage = await browser.newPage();
    await finalPage.setContent(html, { waitUntil: "networkidle0" });
    await finalPage.emulateMediaType("print");

    const pdfBuffer = await finalPage.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (err) {
    console.error("PDF Generation Error:", err);
    throw err;
  }
};
