import { useState } from "react";
import { submitReportAPI } from "../../api/report.api";
import styles from "./Attendance.module.css";

export default function ReportModal({ onSubmit, onCancel }) {
  const [points, setPoints] = useState([""]);

  const update = (i, v) => {
    const p = [...points];
    p[i] = v;
    setPoints(p);
  };

  const submit = async () => {
    await submitReportAPI(points.filter(Boolean));
    onSubmit();
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <h3>Submit Work Report</h3>

        {points.map((p, i) => (
          <input
            key={i}
            value={p}
            onChange={(e) => update(i, e.target.value)}
          />
        ))}

        <button onClick={() => setPoints([...points, ""])}>+ Add Point</button>

        <div className={styles.modalActions}>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={submit}>Submit</button>
        </div>
      </div>
    </div>
  );
}
