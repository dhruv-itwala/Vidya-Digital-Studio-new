import { getAllReportsByDateService } from "./report.service.js";
import PDFDocument from "pdfkit";

export const downloadAllReportsByDatePDF = async (req, res) => {
  const { date } = req.query;
  if (!date)
    return res
      .status(400)
      .json({ message: "Date query parameter is required" });

  const reports = await getAllReportsByDateService(date);
  if (!reports || reports.length === 0)
    return res.status(404).json({ message: "No reports found for this date" });

  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const fileName = `${formattedDate} Work Report.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(res);

  // ---------- TITLE ----------
  doc
    .fontSize(22)
    .fillColor("#333333")
    .text("Daily Work Report", { align: "center", underline: true });

  doc.moveDown(0.5);
  doc
    .fontSize(12)
    .fillColor("#555555")
    .text(`Date: ${formattedDate}`, { align: "center" });
  doc.moveDown(1.5);

  // ---------- TABLE SETUP ----------
  const tableTop = doc.y;
  const itemX = 50;
  const tasksX = 250;
  const tableWidth = 500;
  const rowHeight = 25;

  // Draw table header background
  doc.rect(itemX - 5, tableTop - 5, tableWidth, rowHeight).fill("#f0f0f0");
  doc.fillColor("#000000");

  // Draw headers
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Name", itemX, tableTop, { width: 180, align: "left" })
    .text("Tasks Completed", tasksX, tableTop, { width: 300, align: "left" });

  // Draw horizontal line under header
  doc
    .moveTo(itemX - 5, tableTop + rowHeight - 5)
    .lineTo(itemX - 5 + tableWidth, tableTop + rowHeight - 5)
    .strokeColor("#aaaaaa")
    .stroke();

  let i = 0;
  reports.forEach((report) => {
    const y = tableTop + rowHeight + i * rowHeight;

    // Alternating row color
    if (i % 2 === 0) {
      doc.rect(itemX - 5, y - 5, tableWidth, rowHeight).fill("#f9f9f9");
      doc.fillColor("#000000");
    }

    // Name column
    doc.fontSize(11).font("Helvetica").text(report.user.name, itemX, y, {
      width: 180,
      align: "left",
    });

    // Tasks column
    doc.text(report.workPoints.join(", "), tasksX, y, {
      width: 300,
      align: "left",
    });

    // Horizontal line after row
    doc
      .moveTo(itemX - 5, y + rowHeight - 5)
      .lineTo(itemX - 5 + tableWidth, y + rowHeight - 5)
      .strokeColor("#e0e0e0")
      .stroke();

    i++;
  });

  // ---------- FOOTER ----------
  doc.moveDown(2);
  doc
    .fontSize(10)
    .fillColor("#999999")
    .text(`Total Reports: ${reports.length}`, { align: "right" });

  doc.end();
};
