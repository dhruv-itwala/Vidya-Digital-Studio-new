import {
  getReportsByEmployeesAndDateRangeService,
  getReportsWithWorkingHrsByDateService,
} from "./report.service.js";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const IST = "Asia/Kolkata";

/**
 * Download Daily Work Report for all employees on a single date
 */
export const downloadAllReportsByDatePDF = async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ message: "Date query parameter is required" });
  }

  // Fetch reports with working hours
  const reports = await getReportsWithWorkingHrsByDateService(date);

  if (!reports || reports.length === 0) {
    return res.status(404).json({ message: "No reports found for this date" });
  }

  const reportDate = dayjs(date).tz(IST);
  const formattedDate = reportDate.format("DD MMMM YYYY");
  const dayName = reportDate.format("dddd");

  // Set headers for PDF download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${formattedDate} Work Report.pdf"`,
  );

  const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
  doc.pipe(res);

  const tableLeft = 40;
  const tableWidth = 515;
  const colNameWidth = 145;
  const colWorkWidth = 370; // 515 - 145
  const cellPaddingX = 8;
  const cellPaddingY = 7;
  const maxBottomY = 775;

  let currentY = 40;

  // Header Banner
  doc.rect(tableLeft, currentY, tableWidth, 38).fill("#0f5c44");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15).text("VIDYA DIGITAL STUDIO", tableLeft + 14, currentY + 7);
  doc.fontSize(8.5).font("Helvetica").text("OFFICIAL DAILY WORK REPORT", tableLeft + 14, currentY + 23);
  doc.fontSize(8.5).font("Helvetica").text(`Date: ${formattedDate} (${dayName})`, tableLeft, currentY + 23, { width: tableWidth - 14, align: "right" });
  currentY += 46;

  // Summary Bar
  doc.rect(tableLeft, currentY, tableWidth, 24).fill("#f8fafc");
  doc.rect(tableLeft, currentY, tableWidth, 24).strokeColor("#cbd5e1").lineWidth(0.5).stroke();
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(9.5).text(`Total Submissions: ${reports.length}`, tableLeft + 10, currentY + 6);
  currentY += 30;

  const drawDailyHeader = (y) => {
    doc.rect(tableLeft, y, tableWidth, 24).fill("#0f5c44");
    doc.rect(tableLeft, y, tableWidth, 24).strokeColor("#0f5c44").lineWidth(0.5).stroke();
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#ffffff");
    doc.text("Employee Name", tableLeft + cellPaddingX, y + 7, { width: colNameWidth - cellPaddingX * 2 });
    doc.text("Tasks Completed / Work Report", tableLeft + colNameWidth + cellPaddingX, y + 7, { width: colWorkWidth - cellPaddingX * 2 });
    return y + 24;
  };

  currentY = drawDailyHeader(currentY);

  reports.forEach((report, index) => {
    const empName = report.user?.name || "Unknown";
    const empEmail = report.user?.email || "";
    const workingHours = report.workingHours ? `${report.workingHours} hrs` : "";

    const tasksText = report.workPoints && report.workPoints.length > 0
      ? report.workPoints.map((t) => `•  ${t.trim()}`).join("\n")
      : "•  No tasks submitted";

    doc.font("Helvetica").fontSize(9);
    const nameHeight = 28;
    const workHeight = doc.heightOfString(tasksText, {
      width: colWorkWidth - cellPaddingX * 2,
      lineGap: 3,
    });

    const rowContentHeight = Math.max(nameHeight, workHeight);
    const rowHeight = rowContentHeight + cellPaddingY * 2;

    if (currentY + rowHeight > maxBottomY) {
      doc.addPage();
      currentY = 40;
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f5c44").text(`Daily Work Report • ${formattedDate} (Continued)`, tableLeft, currentY);
      currentY += 15;
      currentY = drawDailyHeader(currentY);
    }

    // Row Background (Zebra)
    doc.rect(tableLeft, currentY, tableWidth, rowHeight).fill(index % 2 === 0 ? "#ffffff" : "#f8fafc");

    // Row Borders
    doc.rect(tableLeft, currentY, tableWidth, rowHeight).strokeColor("#cbd5e1").lineWidth(0.5).stroke();
    doc.moveTo(tableLeft + colNameWidth, currentY).lineTo(tableLeft + colNameWidth, currentY + rowHeight).strokeColor("#cbd5e1").lineWidth(0.5).stroke();

    // Employee Column
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a").text(empName, tableLeft + cellPaddingX, currentY + cellPaddingY, {
      width: colNameWidth - cellPaddingX * 2,
    });
    if (empEmail) {
      doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(empEmail, tableLeft + cellPaddingX, currentY + cellPaddingY + 12, {
        width: colNameWidth - cellPaddingX * 2,
      });
    }
    if (workingHours) {
      doc.font("Helvetica").fontSize(7.5).fillColor("#059669").text(`Shift: ${workingHours}`, tableLeft + cellPaddingX, currentY + cellPaddingY + (empEmail ? 23 : 13), {
        width: colNameWidth - cellPaddingX * 2,
      });
    }

    // Tasks Column
    doc.font("Helvetica").fontSize(9).fillColor("#1e293b").text(tasksText, tableLeft + colNameWidth + cellPaddingX, currentY + cellPaddingY, {
      width: colWorkWidth - cellPaddingX * 2,
      lineGap: 3,
    });

    currentY += rowHeight;
  });

  // Footers
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.fontSize(8).fillColor("#94a3b8").text(
      `Vidya Digital Studio • Daily Work Report • Page ${i + 1} of ${range.count}`,
      tableLeft,
      doc.page.height - 25,
      { width: tableWidth, align: "center", lineBreak: false }
    );
    doc.page.margins.bottom = oldBottom;
  }

  doc.end();
};

/**
 * Download Custom Range Work Report Export PDF
 * Formatted by:
 * - Employee Name
 *   - Month 1 (Table: Date | Work)
 *   - Month 2 (Table: Date | Work)
 *   ...
 */
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

  if (!reports || reports.length === 0) {
    return res.status(404).json({ message: "No reports found" });
  }

  /* -------- GROUP BY EMPLOYEE, THEN BY MONTH -------- */
  const grouped = new Map();
  reports.forEach((r) => {
    if (!r.user) return;
    const empId = r.user._id.toString();

    if (!grouped.has(empId)) {
      grouped.set(empId, {
        user: r.user,
        months: new Map(), // key: "YYYY-MM", value: { monthKey, monthLabel, reports: [] }
      });
    }

    const reportDate = dayjs.utc(r.date).tz(IST);
    const monthKey = reportDate.format("YYYY-MM");
    const monthLabel = reportDate.format("MMMM YYYY");

    const empData = grouped.get(empId);
    if (!empData.months.has(monthKey)) {
      empData.months.set(monthKey, {
        monthKey,
        monthLabel,
        reports: [],
      });
    }

    empData.months.get(monthKey).reports.push({
      ...r,
      dayjsDate: reportDate,
    });
  });

  /* -------- PDF SETUP -------- */
  const fromFormatted = dayjs(fromDate).format("DD MMM YYYY");
  const toFormatted = dayjs(toDate).format("DD MMM YYYY");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Work_Report_${fromDate}_to_${toDate}.pdf"`,
  );

  const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
  doc.pipe(res);

  const tableLeft = 40;
  const tableWidth = 515;
  const colDateWidth = 120;
  const colWorkWidth = 395; // 515 - 120
  const cellPaddingX = 8;
  const cellPaddingY = 7;
  const maxBottomY = 775;

  const drawTableHeader = (y) => {
    doc.rect(tableLeft, y, tableWidth, 24).fill("#0f5c44");
    doc.rect(tableLeft, y, tableWidth, 24).strokeColor("#0f5c44").lineWidth(0.5).stroke();
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#ffffff");
    doc.text("Date", tableLeft + cellPaddingX, y + 7, { width: colDateWidth - cellPaddingX * 2 });
    doc.text("Work", tableLeft + colDateWidth + cellPaddingX, y + 7, { width: colWorkWidth - cellPaddingX * 2 });
    return y + 24;
  };

  let isFirstEmployee = true;

  for (const [, empData] of grouped) {
    if (!isFirstEmployee) {
      doc.addPage();
    }
    isFirstEmployee = false;
    let currentY = 40;

    // Studio Header Banner
    doc.rect(tableLeft, currentY, tableWidth, 38).fill("#0f5c44");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15).text("VIDYA DIGITAL STUDIO", tableLeft + 14, currentY + 7);
    doc.fontSize(8.5).font("Helvetica").text("OFFICIAL EMPLOYEE WORK REPORT • EXPORT", tableLeft + 14, currentY + 23);
    doc.fontSize(8.5).font("Helvetica").text(`Period: ${fromFormatted} – ${toFormatted}`, tableLeft, currentY + 23, { width: tableWidth - 14, align: "right" });
    currentY += 46;

    // Employee Information Card
    const totalReportsCount = Array.from(empData.months.values()).reduce(
      (sum, m) => sum + m.reports.length,
      0
    );
    const monthsCount = empData.months.size;

    doc.rect(tableLeft, currentY, tableWidth, 30).fill("#f8fafc");
    doc.rect(tableLeft, currentY, tableWidth, 30).strokeColor("#cbd5e1").lineWidth(0.5).stroke();
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11).text(`Employee: ${empData.user.name || "N/A"}`, tableLeft + 10, currentY + 6);
    doc.fillColor("#64748b").font("Helvetica").fontSize(8.5).text(`Email: ${empData.user.email || "—"}   |   Total: ${totalReportsCount} Daily ${totalReportsCount === 1 ? "Report" : "Reports"} across ${monthsCount} ${monthsCount === 1 ? "Month" : "Months"}`, tableLeft + 10, currentY + 18);
    currentY += 38;

    // Sorted Months (Month 1, Month 2, ...)
    const sortedMonths = Array.from(empData.months.values()).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey)
    );

    if (sortedMonths.length === 0) {
      doc.rect(tableLeft, currentY, tableWidth, 36).fill("#ffffff");
      doc.rect(tableLeft, currentY, tableWidth, 36).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
      doc.font("Helvetica-Oblique").fontSize(9.5).fillColor("#94a3b8").text("No work reports submitted during this period.", tableLeft, currentY + 12, { width: tableWidth, align: "center" });
      continue;
    }

    sortedMonths.forEach((m, mIdx) => {
      // Sort reports in this month chronologically
      m.reports.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Space check for Month Header + Table Header + at least 1 row (~95pt)
      if (currentY + 95 > maxBottomY) {
        doc.addPage();
        currentY = 40;
      }

      // Month Section Banner: Month 1, Month 2, ...
      doc.rect(tableLeft, currentY, tableWidth, 22).fill("#ecfdf5");
      doc.rect(tableLeft, currentY, tableWidth, 22).strokeColor("#a7f3d0").lineWidth(0.5).stroke();
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#065f46").text(`Month ${mIdx + 1}: ${m.monthLabel}`, tableLeft + 10, currentY + 6);
      doc.font("Helvetica").fontSize(8.5).fillColor("#047857").text(`${m.reports.length} ${m.reports.length === 1 ? "Submission" : "Submissions"}`, tableLeft, currentY + 6, { width: tableWidth - 10, align: "right" });
      currentY += 26;

      // Table Header (Date | Work)
      currentY = drawTableHeader(currentY);

      // Render Rows
      m.reports.forEach((r, rIdx) => {
        const reportDate = r.dayjsDate || dayjs.utc(r.date).tz(IST);
        const dateLine = reportDate.format("DD MMM YYYY");
        const dayLine = reportDate.format("dddd");

        const tasksText = r.workPoints && r.workPoints.length > 0
          ? r.workPoints.map((p) => `•  ${p.trim()}`).join("\n")
          : "•  No work tasks submitted";

        doc.font("Helvetica").fontSize(9);
        const dateHeight = 26;
        const workHeight = doc.heightOfString(tasksText, {
          width: colWorkWidth - cellPaddingX * 2,
          lineGap: 3,
        });

        const rowContentHeight = Math.max(dateHeight, workHeight);
        const rowHeight = rowContentHeight + cellPaddingY * 2;

        // Check page overflow
        if (currentY + rowHeight > maxBottomY) {
          doc.addPage();
          currentY = 40;
          doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f5c44").text(`${empData.user.name} • Month ${mIdx + 1}: ${m.monthLabel} (Continued)`, tableLeft, currentY);
          currentY += 15;
          currentY = drawTableHeader(currentY);
        }

        // Alternating zebra background
        doc.rect(tableLeft, currentY, tableWidth, rowHeight).fill(rIdx % 2 === 0 ? "#ffffff" : "#f8fafc");

        // Cell borders (full box + vertical divider)
        doc.rect(tableLeft, currentY, tableWidth, rowHeight).strokeColor("#cbd5e1").lineWidth(0.5).stroke();
        doc.moveTo(tableLeft + colDateWidth, currentY).lineTo(tableLeft + colDateWidth, currentY + rowHeight).strokeColor("#cbd5e1").lineWidth(0.5).stroke();

        // Date Cell (Bold date + muted day of week)
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a").text(dateLine, tableLeft + cellPaddingX, currentY + cellPaddingY, {
          width: colDateWidth - cellPaddingX * 2,
        });
        doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(dayLine, tableLeft + cellPaddingX, currentY + cellPaddingY + 12, {
          width: colDateWidth - cellPaddingX * 2,
        });

        // Work Cell
        doc.font("Helvetica").fontSize(9).fillColor("#1e293b").text(tasksText, tableLeft + colDateWidth + cellPaddingX, currentY + cellPaddingY, {
          width: colWorkWidth - cellPaddingX * 2,
          lineGap: 3,
        });

        currentY += rowHeight;
      });

      // Space before next month
      currentY += 16;
    });
  }

  // Page numbering footer across all pages
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.fontSize(8).fillColor("#94a3b8").text(
      `Vidya Digital Studio • Employee Work Report • Page ${i + 1} of ${range.count}`,
      tableLeft,
      doc.page.height - 25,
      { width: tableWidth, align: "center", lineBreak: false }
    );
    doc.page.margins.bottom = oldBottom;
  }

  doc.end();
};
