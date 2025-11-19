// services/Pdf.service.js
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import ejs from "ejs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Paginate rows by measuring actual rendered TR heights inside a measurement page
 * that mimics the final PDF layout closely (main-content, padding, fonts, table width).
 */
async function paginateRowsByHeight(page, items, css) {
  // Ensure measurement viewport matches A4-ish rendering at 96dpi (approx)
  await page.setViewport({ width: 794, height: 1122, deviceScaleFactor: 1 });

  const tempHTML = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
${css}

/* Minimal overrides to ensure measurement matches final template */
body { margin: 0; padding: 0; box-sizing: border-box; }
.main-content {
  /* replicate the top offset so table width/wrapping matches final template */
  margin-top: calc(var(--top-offset));
  padding-left: 20px;
  padding-right: 20px;
  box-sizing: border-box;
}
.page-body { padding: 0; box-sizing: border-box; }

.items-table { 
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

/* Use identical cell paddings and font sizing as final CSS */
.items-table td, .items-table th {
  padding: 12px;
  font-size: 16px;
  vertical-align: top;
  word-wrap: break-word;
  border: 1px solid #000;
  box-sizing: border-box;
}
</style>
</head>
<body>
  <main class="main-content">
    <div class="page-body">
      <table class="items-table">
        <tbody>
          ${items
            .map(
              (i) => `
            <tr>
              <td>${escapeHtml(i.category || "")}</td>
              <td>${escapeHtml(i.service || "")}</td>
              <td>${escapeHtml(i.description || "-")}</td>
              <td style="text-align:center">${escapeHtml(
                String(i.quantity || "-")
              )}</td>
              <td style="text-align:center">${escapeHtml(
                String(i.total || 0)
              )}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>`;

  await page.setContent(tempHTML, { waitUntil: "networkidle0" });

  // Wait for rows to be present
  await page.waitForSelector("tr");

  // Read actual heights of each row
  const rowHeights = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("tr")).map((tr) => {
      // offsetHeight includes borders/padding — good for our use
      return tr.offsetHeight;
    });
  });

  // Safe max page height — tuned to your layout. If you change header/contact/footer
  const MAX_FIRST_PAGE_HEIGHT = 360; // page 1 limit
  const MAX_OTHER_PAGE_HEIGHT = 560; // page 2+ limit

  let pages = [];
  let currentPage = [];
  let heightUsed = 0;
  let currentLimit = MAX_FIRST_PAGE_HEIGHT;

  items.forEach((item, index) => {
    const thisHeight = rowHeights[index] || 28;

    if (heightUsed + thisHeight > currentLimit) {
      // close current page
      pages.push(currentPage);

      // start new page
      currentPage = [item];
      heightUsed = thisHeight;

      // if we just finished page 1, change the limit for remaining
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
}) => {
  try {
    const templatePath = path.join(__dirname, "../templates/quoteTemplate.ejs");
    const cssPath = path.join(__dirname, "../templates/pdf-styles.css");

    const css = fs.readFileSync(cssPath, "utf8");

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // measurement page used to compute pagination
    const measurementPage = await browser.newPage();

    // 1) PAGINATION
    const pages = await paginateRowsByHeight(measurementPage, items, css);
    await measurementPage.close();

    // Calculate subtotal (ensure numbers)
    const subtotal = items.reduce((t, i) => t + (Number(i.total) || 0), 0);

    // 2) RENDER TEMPLATE
    const html = await ejs.renderFile(templatePath, {
      client,
      items,
      pages,
      subtotal,
      notes: Array.isArray(notes) ? notes : [],
      duration,
      css,
      logoUrl:
        "https://res.cloudinary.com/dmt7dysjh/image/upload/v1763035703/jtvl8nd5iux8lv3lhvvb.png",
      signatureUrl:
        "https://res.cloudinary.com/dmt7dysjh/image/upload/v1763035703/zvxeqdgxgolw6mwwydko.png",
      watermarkUrl:
        "https://res.cloudinary.com/dmt7dysjh/image/upload/v1763035782/su3nyob2kedbc9k7swb2.png",
    });

    // 3) GENERATE PDF
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
