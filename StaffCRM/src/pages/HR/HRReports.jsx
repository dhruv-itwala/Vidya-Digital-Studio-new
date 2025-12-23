import { useState, useEffect } from "react";
import styles from "./HRReports.module.css";
import {
  downloadAllReportsByDatePDF,
  getAllReportsByDate,
} from "../../api/report.api";
import toast from "react-hot-toast";

const today = () => new Date().toISOString().split("T")[0];

export default function HRReports() {
  const [date, setDate] = useState(today());
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

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
      link.download = `${date} Work Report.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download report");
    }
  };

  return (
    <div className={`masterContainer ${styles.container}`}>
      <h2 className={styles.title}>Work Reports</h2>

      <div className={styles.controls}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={styles.dateInput}
        />

        <button onClick={download} className={styles.downloadBtn}>
          Download Reports
        </button>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading reports...</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
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
                  <td colSpan="3" className={styles.empty}>
                    No reports found
                  </td>
                </tr>
              )}

              {reports.map((report) => {
                const submitted =
                  report.workPoints && report.workPoints.length > 0;

                return (
                  <tr key={report._id}>
                    <td>{report.user.name}</td>
                    <td
                      className={
                        submitted
                          ? styles.statusSubmitted
                          : styles.statusPending
                      }
                    >
                      {submitted ? "Submitted" : "Pending"}
                    </td>
                    <td>{submitted ? report.workPoints.join(", ") : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
