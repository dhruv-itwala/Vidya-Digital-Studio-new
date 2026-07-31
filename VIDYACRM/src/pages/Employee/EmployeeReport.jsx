import { useEffect, useState } from "react";
import {
  submitReportAPI,
  getMyReportsByDateAPI,
  updateReportAPI,
} from "../../api/report.api";
import styles from "./EmployeeReport.module.css";

export default function EmployeeReport({ onSubmitted }) {
  const MAX_POINTS = 5;
  const [points, setPoints] = useState(Array(MAX_POINTS).fill(""));
  const [reportId, setReportId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const updatePoint = (index, value) => {
    const copy = [...points];
    copy[index] = value;
    setPoints(copy);
  };

  const submitOrUpdateReport = async () => {
    try {
      setLoading(true);
      setMessage("");

      const filtered = points.filter((p) => p.trim());
      if (!filtered.length) {
        setMessage("Please add at least one work point.");
        return;
      }

      if (reportId) {
        await updateReportAPI(reportId, filtered);
        setMessage("✅ Report updated successfully.");
      } else {
        await submitReportAPI(filtered);
        setMessage("✅ Report submitted successfully.");
      }

      if (onSubmitted) onSubmitted();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const fetchTodayReport = async () => {
    try {
      const res = await getMyReportsByDateAPI();
      const report = res?.data?.data;

      if (report?._id) {
        setReportId(report._id);
        const existing = report.workPoints || [];
        // Fill array to exactly 5 elements for UI consistency
        const filled = Array.from({ length: MAX_POINTS }).map(
          (_, i) => existing[i] || ""
        );
        setPoints(filled);
      }
    } catch (e) {
      console.error(e.message);
    }
  };

  useEffect(() => {
    fetchTodayReport();
  }, []);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>DAILY REPORT</h3>
        <span className={styles.logPill}>5-POINT LOG</span>
      </div>

      <div className={styles.inputsWrapper}>
        {points.map((point, i) => (
          <input
            key={i}
            className={styles.input}
            placeholder={`${i + 1}. What did you work on today?`}
            value={point}
            onChange={(e) => updatePoint(i, e.target.value)}
          />
        ))}
      </div>

      {message && (
        <p
          className={`${styles.message} ${
            message.startsWith("✅") ? styles.success : styles.error
          }`}
        >
          {message}
        </p>
      )}

      <button
        className={styles.submitBtn}
        onClick={submitOrUpdateReport}
        disabled={loading}
      >
        {loading ? "Saving..." : "Submit Daily Report"}
      </button>
    </div>
  );
}
