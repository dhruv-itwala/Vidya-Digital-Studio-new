import { useEffect, useState, useCallback } from "react";
import {
  downloadAllReportsByDatePDF,
  downloadCustomReportsPDF,
  getAllReportsByDate,
} from "../../api/report.api";
import styles from "./Reports.module.css";
import Loader from "../../components/Loader/Loader";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export default function Reports() {
  const { allEmployees } = useAuth();

  const [date, setDate] = useState(today());
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [reports, setReports] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllReportsByDate(date);
      setReports(res?.data?.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /* ================= DOWNLOAD DAILY ================= */
  const download = async () => {
    const toastId = toast.loading("Preparing report...");
    try {
      const res = await downloadAllReportsByDatePDF(date);
      downloadBlob(res.data, `${date} Work Report.pdf`);
      toast.success("Report downloaded", { id: toastId });
    } catch (error) {
      toast.error(error.message || "Download failed", { id: toastId });
    }
  };

  /* ================= DOWNLOAD CUSTOM ================= */
  const downloadCustom = async () => {
    if (!selectedEmployees.length) {
      toast.error("Select at least one employee");
      return;
    }

    if (fromDate > toDate) {
      toast.error("From date cannot be after To date");
      return;
    }

    const toastId = toast.loading("Generating custom report...");
    try {
      const res = await downloadCustomReportsPDF(
        selectedEmployees,
        fromDate,
        toDate,
      );
      downloadBlob(res.data, `Work_Report_${fromDate}_to_${toDate}.pdf`);
      toast.success("Custom report downloaded", { id: toastId });
    } catch (error) {
      toast.error(error.message || "Failed to download", { id: toastId });
    }
  };

  /* ================= UTILITY ================= */
  const downloadBlob = (data, filename) => {
    const url = URL.createObjectURL(
      new Blob([data], { type: "application/pdf" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  /* ================= RENDER ================= */
  return (
    <div className="masterContainer" style={{ flexDirection: "column" }}>
      <div className={styles.reportsContainer}>
        <h2>Work Reports</h2>

        <div className={styles.controls}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={styles.dateInput}
          />
          <button
            className={styles.downloadButton}
            onClick={download}
            disabled={loading}
          >
            Download Reports
          </button>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.reportsTable}>
              <thead>
                <tr>
                  <th className={styles.headerRow}>Employee</th>
                  <th className={styles.headerRow}>Status</th>
                  <th className={styles.headerRow}>Work Points</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 && (
                  <tr>
                    <td colSpan="3" className={styles.noReports}>
                      No reports found
                    </td>
                  </tr>
                )}

                {reports.map((report) => {
                  const submitted =
                    report.workPoints && report.workPoints.length > 0;

                  return (
                    <tr key={report._id}>
                      <td>{report.user?.name || "—"}</td>
                      <td>{submitted ? "Submitted" : "Pending"}</td>
                      <td>
                        {submitted ? (
                          <ul className={styles.points}>
                            {report.workPoints.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= CUSTOM ================= */}
      <div className={styles.customDownloadBox}>
        <h2>Download Custom Report</h2>

        <div className={styles.customControls}>
          <input
            type="date"
            className={styles.dateInput}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={today()}
          />
          <input
            type="date"
            className={styles.dateInput}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate}
            max={today()}
          />
          <button className={styles.downloadButton} onClick={downloadCustom}>
            Download Custom Report
          </button>
        </div>

        <div className={styles.employeeList}>
          {allEmployees
            ?.filter((u) => u.role !== "admin")
            .map((emp) => (
              <label key={emp._id} className={styles.employeeCard}>
                <input
                  type="checkbox"
                  checked={selectedEmployees.includes(emp._id)}
                  onChange={(e) =>
                    setSelectedEmployees((prev) =>
                      e.target.checked
                        ? [...prev, emp._id]
                        : prev.filter((id) => id !== emp._id),
                    )
                  }
                />
                <div className={styles.cardContent}>
                  <div className={styles.empName}>{emp.name}</div>
                </div>
              </label>
            ))}
        </div>
      </div>
    </div>
  );
}
