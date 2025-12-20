import { useState, useEffect } from "react";
import {
  downloadAllReportsByDatePDF,
  getAllReportsByDate,
} from "../../api/report.api";

const today = () => new Date().toISOString().split("T")[0];

export default function AdminReports() {
  const [date, setDate] = useState(today());
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch reports when date changes
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await getAllReportsByDate(date);
        setReports(res.data);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch reports");
      }
      setLoading(false);
    };
    fetchReports();
  }, [date]);

  const download = async () => {
    try {
      const res = await downloadAllReportsByDatePDF(date);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Work_Reports_${date}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download report");
    }
  };

  return (
    <div>
      <h2>Work Reports</h2>

      <div style={{ marginBottom: "1rem" }}>
        <label>
          Select Date:{" "}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <button onClick={download} style={{ marginLeft: "1rem" }}>
          Download Reports
        </button>
      </div>

      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Report Status</th>
              <th>Work Points</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  No reports found
                </td>
              </tr>
            )}
            {reports.map((report) => (
              <tr key={report._id}>
                <td>{report.user.name}</td>
                <td>
                  {report.workPoints && report.workPoints.length > 0
                    ? "Submitted"
                    : "Pending"}
                </td>
                <td>
                  {report.workPoints && report.workPoints.length > 0
                    ? report.workPoints.join(", ")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
