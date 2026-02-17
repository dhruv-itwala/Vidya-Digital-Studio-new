import { useEffect, useState } from "react";
import {
  submitReportAPI,
  getMyReportsByDateAPI,
  updateReportAPI,
} from "../../api/report.api";
import styles from "./EmployeeReport.module.css";

export default function EmployeeReport({ onSubmitted }) {
  const [points, setPoints] = useState([""]);
  const [reportId, setReportId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const MAX_POINTS = 3;

  const updatePoint = (index, value) => {
    const copy = [...points];
    copy[index] = value;
    setPoints(copy);
  };

  const addPoint = () => {
    if (points.length < MAX_POINTS) {
      setPoints([...points, ""]);
    } else {
      setMessage(`You can add a maximum of ${MAX_POINTS} points.`);
    }
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
        setMessage("✅ Report submitted successfully. Great work today!");
      }

      if (onSubmitted) onSubmitted();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayReport = async () => {
    try {
      const res = await getMyReportsByDateAPI();

      const report = res?.data?.data; // 👈 important fix

      if (report?._id) {
        setReportId(report._id);
        setPoints(report.workPoints?.length ? report.workPoints : [""]);
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
      <h3 className={styles.title}>
        {reportId ? "Update Daily Report" : "Daily Work Report"}
      </h3>

      {points.map((point, i) => (
        <input
          key={i}
          className={styles.input}
          placeholder={`Work point ${i + 1}`}
          value={point}
          onChange={(e) => updatePoint(i, e.target.value)}
        />
      ))}

      {points.length < MAX_POINTS && (
        <button className={styles.addBtn} onClick={addPoint}>
          + Add another point
        </button>
      )}

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
        {loading ? "Saving..." : reportId ? "Update Report" : "Submit Report"}
      </button>
    </div>
  );
}
