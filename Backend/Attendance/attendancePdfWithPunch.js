// Backend/Attendance/attendancePdfWithPunch.service.js
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
  IC: "#000000",
  "—": "#7f8c8d",
};

/* ---------------- DATA TRANSFORM ---------------- */
function buildAttendanceMatrixWithPunch(data = []) {
  const employees = [];
  const dateMap = {};

  data.forEach((att) => {
    if (!att.userId || !att.name) return;

    const dateKey = dayjs(att.date).format("DD/MM/YYYY");
    const empKey = att.userId; // unique
    const empName = att.name;
    const status = STATUS_MAP[att.status] || "—";
    const punchIn = att.punchIn ? dayjs(att.punchIn).format("HH:mm") : "-";
    const punchOut = att.punchOut ? dayjs(att.punchOut).format("HH:mm") : "-";

    if (!employees.find((e) => e.id === empKey)) {
      employees.push({ id: empKey, name: empName });
    }

    if (!dateMap[dateKey]) {
      dateMap[dateKey] = {};
    }

    dateMap[dateKey][empKey] = { status, punchIn, punchOut };
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
export const downloadAttendanceWithPunchPDFService = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await getAllAttendanceByDateRangeService(from, to);

    const { employees, rows } = buildAttendanceMatrixWithPunch(data);

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 40,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance_punch.pdf"`
    );

    doc.pipe(res);

    /* ---------- TITLE ---------- */
    doc
      .fontSize(18)
      .text("Attendance Sheet with Punch In/Out", { align: "center" });
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
      120,
      (usableWidth - dateColWidth) / employees.length
    );

    /* ---------- HEADER ROW ---------- */
    doc.rect(startX, startY, dateColWidth, rowHeight).stroke();
    doc
      .fontSize(9)
      .fillColor("black")
      .text("Date", startX + 5, startY + 7);

    employees.forEach((emp, i) => {
      const x = startX + dateColWidth + i * empColWidth;
      doc.rect(x, startY, empColWidth, rowHeight).stroke();
      doc
        .fontSize(8)
        .fillColor("black")
        .text(emp.name, x + 2, startY + 2, {
          width: empColWidth - 4,
          align: "center",
        });
      doc
        .fontSize(7)
        .fillColor("black")
        .text("Status | In | Out", x + 2, startY + 14, {
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
        const empData = row.attendance[emp.id] || {
          status: "—",
          punchIn: "-",
          punchOut: "-",
        };
        const color = STATUS_COLOR_MAP[empData.status] || "#000000";

        doc.rect(x, startY, empColWidth, rowHeight).stroke();
        doc
          .fillColor(color)
          .fontSize(9)
          .text(
            `${empData.status} | ${empData.punchIn} | ${empData.punchOut}`,
            x,
            startY + 7,
            { width: empColWidth, align: "center" }
          )
          .fillColor("black");
      });

      startY += rowHeight;
      if (startY > doc.page.height - 50) {
        doc.addPage();
        startY = doc.y;
      }
    });

    /* ---------- LEGEND ---------- */
    doc.moveDown(1);
    doc.x = doc.page.margins.left;
    const legendWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc
      .fontSize(9)
      .fillColor("black")
      .text(
        "Legend: P = Present | A = Absent | H-D = Half Day | L = Leave | WFH = Work From Home | H = Holiday",
        { width: legendWidth, align: "center", lineBreak: false }
      );

    doc.fillColor("black");
    doc.end();
  } catch (error) {
    console.error("PDF generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  }
};
