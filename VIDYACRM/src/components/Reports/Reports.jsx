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
import { FaFilePdf, FaDownload, FaFilter, FaCalendarAlt } from "react-icons/fa";

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
    <div className={styles.pageContainer}>
      
      <div className={styles.headerArea}>
        <h2 className={styles.pageTitle}>
          <FaFilePdf color="var(--deep-forest)" /> Work Reports
        </h2>
        <p className={styles.subHeading}>Monitor and export employee work point submissions.</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Daily Submission Status</h3>
          <div className={styles.controlsGroup}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={styles.inputField}
            />
            <button
              className={styles.primaryBtn}
              onClick={download}
              disabled={loading}
            >
              <FaDownload /> Download PDF
            </button>
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Work Points</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan="3">
                      <div className={styles.emptyState}>No reports found for this date.</div>
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => {
                    const submitted = report.workPoints && report.workPoints.length > 0;
                    return (
                      <tr key={report._id}>
                        <td>
                          <span className={styles.employeeName}>{report.user?.name || "—"}</span>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${submitted ? styles.status_submitted : styles.status_pending}`}>
                            {submitted ? "Submitted" : "Pending"}
                          </span>
                        </td>
                        <td>
                          {submitted ? (
                            <ul className={styles.pointsList}>
                              {report.workPoints.map((p, i) => (
                                <li key={i}>{p}</li>
                              ))}
                            </ul>
                          ) : (
                            <span style={{color: 'var(--color-text-muted)'}}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.customDivider}>Generate Custom Report</div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><FaFilter /> Advanced Filters</h3>
          <div className={styles.controlsGroup}>
            <span style={{fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.9rem'}}>FROM</span>
            <input
              type="date"
              className={styles.inputField}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              max={today()}
            />
            <span style={{fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.9rem'}}>TO</span>
            <input
              type="date"
              className={styles.inputField}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate}
              max={today()}
            />
            <button className={styles.primaryBtn} onClick={downloadCustom}>
              <FaFilePdf /> Export Selected
            </button>
          </div>
        </div>

        <div style={{fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px', fontSize: '0.95rem'}}>
          Select Employees to Include:
        </div>
        
        <div className={styles.employeeGrid}>
          {allEmployees?.map((emp) => (
            <label key={emp._id} className={styles.empCard}>
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
              <div className={styles.empCardContent}>
                <div className={styles.empCheckIndicator}></div>
                <div className={styles.empName}>{emp.name}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
}
