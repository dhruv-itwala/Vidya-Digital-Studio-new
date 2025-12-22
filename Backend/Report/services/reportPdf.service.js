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

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${formattedDate} Work Report.pdf"`
  );

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(res);

  /* ---------- TITLE ---------- */
  doc
    .fontSize(24)
    .fillColor("#1F2937")
    .text("Daily Work Report", { align: "center" });

  doc
    .moveDown(0.3)
    .fontSize(12)
    .text(`Date: ${formattedDate}`, { align: "center" });

  doc.moveDown(1.5);

  /* ---------- TABLE HEADER ---------- */
  const nameX = 50;
  const taskX = 220;
  const tableWidth = 495;

  const drawHeader = () => {
    const y = doc.y;
    doc.rect(45, y - 5, tableWidth, 30).fill("#E5E7EB");

    doc
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("Employee Name", nameX, y, { width: 160 })
      .text("Tasks Completed", taskX, y);

    doc.moveDown(1.5);
  };

  drawHeader();

  /* ---------- TABLE ROWS ---------- */
  reports.forEach((report, index) => {
    const startY = doc.y;

    // Page break check
    if (startY > 700) {
      doc.addPage();
      drawHeader();
    }

    // Background block
    doc
      .rect(45, startY - 5, tableWidth, 10)
      .fill(index % 2 === 0 ? "#F9FAFB" : "#FFFFFF");

    doc.fillColor("#111827").font("Helvetica").fontSize(12);

    // Name
    doc.text(report.user.name, nameX, startY, {
      width: 160,
    });

    // Tasks (bullet list)
    let taskY = startY;
    report.workPoints.forEach((task) => {
      doc.fontSize(11).fillColor("#374151").text(`• ${task}`, taskX, taskY, {
        width: 300,
        lineGap: 3,
      });
      taskY = doc.y;
    });

    // Calculate row height
    const rowHeight = Math.max(taskY - startY, 25);

    // Row divider
    doc
      .moveTo(45, startY + rowHeight + 5)
      .lineTo(45 + tableWidth, startY + rowHeight + 5)
      .strokeColor("#E5E7EB")
      .stroke();

    doc.y = startY + rowHeight + 15;
  });

  /* ---------- FOOTER ---------- */
  doc
    .moveDown(1)
    .fontSize(10)
    .fillColor("#6B7280")
    .text(`Total Reports: ${reports.length}`, { align: "right" });

  doc.end();
};
