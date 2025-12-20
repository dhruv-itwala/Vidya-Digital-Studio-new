import { useState, useEffect } from "react";
import {
  downloadAttendancePDF,
  getAllAttendanceAPI,
} from "../../api/attendance.api";
import styles from "./AdminAttendance.module.css";

export default function AdminAttendance() {
  const [singleDate, setSingleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceList, setAttendanceList] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await getAllAttendanceAPI(singleDate);
        setAttendanceList(res.data);
      } catch (err) {
        console.error("Failed to fetch attendance:", err);
      }
    };

    fetchAttendance();
  }, [singleDate]);

  const downloadPDF = async () => {
    try {
      const res = await downloadAttendancePDF(from, to);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url);
    } catch (err) {
      console.error("Failed to download PDF:", err);
    }
  };

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <h2>Attendance Report</h2>

        {/* Single Day Attendance */}
        <div>
          <h3>Present Employees</h3>
          <div className={styles.dateInputs}>
            <input
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
            />
          </div>
          <div className={styles.tableContainer}>
            <table>
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceList.map((emp, index) => (
                  <tr key={index}>
                    <td>{emp.user?.name || "Unknown"}</td>
                    <td
                      className={
                        emp.punchIn ? styles.statusPresent : styles.statusAbsent
                      }
                    >
                      {emp.punchIn ? "Present" : "Absent"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PDF Download */}
        <div className={styles.downloadSection}>
          <h3>Download Attendance Sheet</h3>
          <div className={styles.dateInputs}>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <button onClick={downloadPDF}>Download PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}
