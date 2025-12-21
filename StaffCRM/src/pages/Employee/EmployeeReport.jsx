import { useState } from "react";
import { submitReportAPI } from "../../api/report.api";
import styles from "./EmployeeReport.module.css";

export default function EmployeeReport() {
  const [points, setPoints] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const updatePoint = (index, value) => {
    const copy = [...points];
    copy[index] = value;
    setPoints(copy);
  };

  const addPoint = () => setPoints([...points, ""]);

  const submitReport = async () => {
    try {
      setLoading(true);
      setMessage("");

      const filtered = points.filter((p) => p.trim());
      if (!filtered.length) {
        setMessage("Please add at least one work point.");
        return;
      }

      await submitReportAPI(filtered);

      setMessage("✅ Report submitted successfully. Great work today!");
      setPoints([""]);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Daily Work Report</h3>

      {points.map((point, i) => (
        <input
          key={i}
          className={styles.input}
          placeholder={`Work point ${i + 1}`}
          value={point}
          onChange={(e) => updatePoint(i, e.target.value)}
        />
      ))}

      <button className={styles.addBtn} onClick={addPoint}>
        + Add another point
      </button>

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
        onClick={submitReport}
        disabled={loading}
      >
        {loading ? "Submitting..." : "Submit Report"}
      </button>
    </div>
  );
}
