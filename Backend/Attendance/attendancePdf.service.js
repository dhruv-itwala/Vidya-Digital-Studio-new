import PDFDocument from "pdfkit";
import dayjs from "dayjs";
import { getAllAttendanceByDateRangeService } from "./attendance.service.js";

/* ---------------- STATUS MAPS ---------------- */

const STATUS_MAP = {
  PRESENT: "P",
  ABSENT: "A",
  HALF_DAY: "H-D",
  LEAVE: "L",
  WFH: "WFH",
  HOLIDAY: "H",
};

const STATUS_COLOR_MAP = {
  P: "#2ecc71", // green
  A: "#e74c3c", // red
  "H-D": "#f39c12", // orange
  L: "#9b59b6", // purple
  WFH: "#3498db", // blue
  H: "#95a5a6", // gray
  "—": "#7f8c8d", // default
};

/* ---------------- DATA TRANSFORM ---------------- */

function buildAttendanceMatrix(data) {
  const employees = [];
  const dateMap = {};

  data.forEach((att) => {
    const dateKey = dayjs(att.date).format("DD/MM/YYYY");
    const empName = att.user.name;
    const status = STATUS_MAP[att.status] || "—";

    if (!employees.includes(empName)) {
      employees.push(empName);
    }

    if (!dateMap[dateKey]) {
      dateMap[dateKey] = {};
    }

    dateMap[dateKey][empName] = status;
  });

  const rows = Object.keys(dateMap)
    .sort((a, b) => dayjs(a, "DD/MM/YYYY") - dayjs(b, "DD/MM/YYYY"))
    .map((date) => ({
      date,
      attendance: dateMap[date],
    }));

  return { employees, rows };
}

/* ---------------- PDF SERVICE ---------------- */

export const downloadAttendancePDFService = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await getAllAttendanceByDateRangeService(from, to);

    const { employees, rows } = buildAttendanceMatrix(data);

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 40,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance.pdf"`
    );

    doc.pipe(res);

    /* ---------- TITLE ---------- */
    doc.fontSize(18).text("Attendance Sheet", { align: "center" });
    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .text(`From: ${dayjs(from).format("DD/MM/YYYY")}`)
      .text(`To: ${dayjs(to).format("DD/MM/YYYY")}`);

    doc.moveDown(1);

    /* ---------- TABLE CONFIG ---------- */
    const startX = doc.x;
    let startY = doc.y;

    const rowHeight = 25;
    const dateColWidth = 80;

    const usableWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const empColWidth = Math.min(
      80,
      (usableWidth - dateColWidth) / employees.length
    );

    /* ---------- HEADER ROW ---------- */
    doc.rect(startX, startY, dateColWidth, rowHeight).stroke();
    doc
      .fontSize(9)
      .fillColor("black")
      .text("Date", startX + 5, startY + 7);

    employees.forEach((name, i) => {
      const x = startX + dateColWidth + i * empColWidth;

      doc.rect(x, startY, empColWidth, rowHeight).stroke();

      doc
        .fontSize(8)
        .fillColor("black")
        .text(name, x + 2, startY + 7, {
          width: empColWidth - 4,
          align: "center",
        });
    });

    startY += rowHeight;

    /* ---------- DATA ROWS ---------- */
    rows.forEach((row) => {
      doc.rect(startX, startY, dateColWidth, rowHeight).stroke();
      doc
        .fontSize(9)
        .fillColor("black")
        .text(row.date, startX + 5, startY + 7);

      employees.forEach((emp, i) => {
        const x = startX + dateColWidth + i * empColWidth;
        const value = row.attendance[emp] || "—";
        const color = STATUS_COLOR_MAP[value] || "#000000";

        doc.rect(x, startY, empColWidth, rowHeight).stroke();

        doc
          .fillColor(color)
          .fontSize(9)
          .text(value, x, startY + 7, {
            width: empColWidth,
            align: "center",
          })
          .fillColor("black");
      });

      startY += rowHeight;

      if (startY > doc.page.height - 50) {
        doc.addPage();
        startY = doc.y;
      }
    });

    /* ---------- LEGEND (ONE LINE) ---------- */
    /* ---------- LEGEND (FORCED ONE LINE) ---------- */

    doc.moveDown(1);

    // reset X position to left margin
    doc.x = doc.page.margins.left;

    const legendWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc
      .fontSize(9)
      .fillColor("black")
      .text(
        "Legend: P = Present | A = Absent | H-D = Half Day | L = Leave | WFH = Work From Home | H = Holiday",
        {
          width: legendWidth,
          align: "center",
          lineBreak: false, // 🚨 force single line
        }
      );

    doc.fillColor("black");
    /* ---------- FINALIZE ---------- */
    doc.end();
  } catch (error) {
    console.error("PDF generation error:", error);

    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  }
};
