import PDFDocument from "pdfkit";
import { getAllAttendanceService } from "../services/attendance.service.js";

export const downloadAttendancePDF = async (req, res) => {
  const { from, to } = req.query;
  const data = await getAllAttendanceService(from, to);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="attendance.pdf"`);

  doc.pipe(res);

  doc.fontSize(18).text("Attendance Report", { align: "center" });
  doc.moveDown();

  data.forEach((att) => {
    const status = att.punchIn && att.punchOut ? "Present" : "Absent";
    doc.fontSize(12).text(`${att.date} | ${att.user.name} | ${status}`);
  });

  doc.end();
};
