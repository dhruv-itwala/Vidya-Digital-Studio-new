import {
  getReportsByEmployeesAndDateRangeService,
  getReportsWithWorkingHrsByDateService,
} from "./report.service.js";
import PDFDocument from "pdfkit";

export const downloadAllReportsByDatePDF = async (req, res) => {
  const { date } = req.query;
  if (!date)
    return res
      .status(400)
      .json({ message: "Date query parameter is required" });

  // Fetch reports with working hours
  const reports = await getReportsWithWorkingHrsByDateService(date);

  if (!reports || reports.length === 0)
    return res.status(404).json({ message: "No reports found for this date" });

  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Set headers for PDF download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${formattedDate} Work Report.pdf"`,
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
  const hoursX = 220; // new column for working hours
  const taskX = 300; // tasks start after hours column
  const tableWidth = 495;

  const drawHeader = () => {
    const y = doc.y;
    doc.rect(45, y - 5, tableWidth, 30).fill("#E5E7EB");

    doc
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("Employee Name", nameX, y, { width: 160 })
      // .text("Working Hrs", hoursX, y, { width: 60 })
      .text("Tasks Completed", taskX, y);

    doc.moveDown(1.5);
  };

  drawHeader();

  /* ---------- TABLE ROWS ---------- */
  reports.forEach((report, index) => {
    const startY = doc.y;

    // Page break
    if (startY > 700) {
      doc.addPage();
      drawHeader();
    }

    // Background color for alternating rows
    doc
      .rect(45, startY - 5, tableWidth, 10)
      .fill(index % 2 === 0 ? "#F9FAFB" : "#FFFFFF");

    doc.fillColor("#111827").font("Helvetica").fontSize(12);

    // Employee Name
    doc.text(report.user.name, nameX, startY, { width: 160 });

    // Working Hours
    // doc.text(`${report.workingHours} hrs`, hoursX, startY, { width: 60 });

    // Tasks (bullet list)
    let taskY = startY;
    report.workPoints.forEach((task) => {
      doc.fontSize(11).fillColor("#374151").text(`• ${task}`, taskX, taskY, {
        width: 260,
        lineGap: 3,
      });
      taskY = doc.y;
    });

    // Row height & divider
    const rowHeight = Math.max(taskY - startY, 25);
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

export const downloadCustomReportsPDF = async (req, res) => {
  const { employeeIds, fromDate, toDate } = req.body;

  if (!employeeIds?.length || !fromDate || !toDate) {
    return res.status(400).json({
      message: "employeeIds, fromDate and toDate are required",
    });
  }

  const reports = await getReportsByEmployeesAndDateRangeService(
    employeeIds,
    fromDate,
    toDate,
  );

  if (!reports.length) {
    return res.status(404).json({ message: "No reports found" });
  }

  /* -------- GROUP BY EMPLOYEE -------- */
  const grouped = {};
  reports.forEach((r) => {
    const id = r.user._id.toString();
    if (!grouped[id]) {
      grouped[id] = {
        user: r.user,
        reports: [],
      };
    }
    grouped[id].reports.push(r);
  });

  /* -------- PDF SETUP -------- */
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Work_Report_${fromDate}_to_${toDate}.pdf"`,
  );

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(res);

  doc
    .fontSize(22)
    .text("Employee Work Report", { align: "center" })
    .moveDown(0.5)
    .fontSize(12)
    .text(`From ${fromDate} to ${toDate}`, { align: "center" })
    .moveDown(2);

  /* -------- PER EMPLOYEE -------- */
  Object.values(grouped).forEach(({ user, reports }, index) => {
    if (index !== 0) doc.addPage();

    /* Employee Name */
    doc
      .fontSize(16)
      .fillColor("#111827")
      .text(`Employee: ${user.name}`)
      .moveDown(1);

    /* Table Header */
    const dateX = 50;
    const dateWidth = 120; // bigger
    const workX = dateX + dateWidth + 15;
    const workWidth = 500 - dateWidth - 30;

    doc
      .font("Helvetica-Bold")
      .rect(45, doc.y - 5, 500, 25)
      .fill("#E5E7EB")
      .fillColor("#000")
      .text("Date", dateX, doc.y)
      .text("Work Report", workX, doc.y);

    doc.moveDown(1.5).font("Helvetica");

    /* Table Rows */
    reports.forEach((r, index) => {
      const rowTop = doc.y;

      const formattedDate = new Date(r.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
      });

      const tasksText = r.workPoints.map((t) => `• ${t}`).join("\n");

      const dateHeight = doc.heightOfString(formattedDate, {
        width: dateWidth,
      });
      const taskHeight = doc.heightOfString(tasksText, { width: workWidth });

      const rowHeight = Math.max(dateHeight, taskHeight, 25);

      if (doc.y + rowHeight > 750) doc.addPage();

      doc.fillColor("#000").font("Helvetica");

      // DATE (no wrap now)
      doc.text(formattedDate, dateX, rowTop, {
        width: dateWidth,
        lineBreak: false, // important
      });

      // TASKS
      doc.text(tasksText, workX, rowTop, {
        width: workWidth,
        lineGap: 2,
      });

      doc.y = rowTop + rowHeight + 15;
    });
  });

  doc.end();
};
