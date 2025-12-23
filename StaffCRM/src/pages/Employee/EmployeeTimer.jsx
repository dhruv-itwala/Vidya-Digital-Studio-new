import { useEffect, useRef, useState } from "react";
import {
  punchInAPI,
  punchOutAPI,
  breakInAPI,
  breakOutAPI,
  getTodayWorkRecordAPI,
} from "../../api/attendance.api";
import styles from "./EmployeeTimer.module.css";

const WORK_TARGET_SECONDS = 8 * 60 * 60; // 8 hours

export default function EmployeeTimer({ onPunchIn, onPunchOutAttempt }) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const intervalRef = useRef(null);

  /* -------------------- Messages -------------------- */
  const getMessage = (type) => {
    const messages = {
      punchIn: "Hey 👋 Have a great day 🚀",
      breakIn: "☕ Enjoy your break!",
      breakOut: "Welcome back! 💪",
      punchOut: "Great work today! 🌟",
    };
    return messages[type] || "";
  };

  /* -------------------- Sync From Server -------------------- */
  const syncFromServer = async () => {
    const res = await getTodayWorkRecordAPI();
    const record = res?.data;

    if (!record) {
      setSeconds(0);
      setIsRunning(false);
      setOnBreak(false);
      return;
    }

    const lastBreak = record.breaks?.at(-1);
    const breakActive = lastBreak && !lastBreak.out;

    setSeconds(record.netWorkMinutes * 60);
    setIsRunning(!!record.punchIn && !record.punchOut && !breakActive);
    setOnBreak(breakActive);
  };

  /* -------------------- Timer Interval -------------------- */
  useEffect(() => {
    clearInterval(intervalRef.current);

    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  /* -------------------- Initial Load + Polling -------------------- */
  useEffect(() => {
    syncFromServer();
    const poll = setInterval(syncFromServer, 30000);
    return () => clearInterval(poll);
  }, []);

  /* -------------------- Actions -------------------- */
  const handleAction = async (api, type) => {
    if (
      type === "punchOut" &&
      onPunchOutAttempt &&
      !(await onPunchOutAttempt())
    ) {
      setMessage("⚠️ Submit your report before punching out.");
      setTimeout(() => setMessage(""), 4000);
      return;
    }

    try {
      setLoading(true);
      await api();
      await syncFromServer();
      setMessage(getMessage(type));

      if (type === "punchIn" && onPunchIn) onPunchIn();
    } catch (e) {
      setMessage(e.message || "Action failed");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  /* -------------------- Helpers -------------------- */
  const formatTime = () => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  const progress = Math.min((seconds / WORK_TARGET_SECONDS) * 100, 100);

  /* -------------------- Circular UI -------------------- */
  const radius = 70;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  /* -------------------- Button States -------------------- */
  const canPunchIn = !isRunning && !onBreak;
  const canPunchOut = isRunning;
  const canBreakIn = isRunning && !onBreak;
  const canBreakOut = onBreak;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Today’s Work Progress</h3>

      <div className={styles.circularProgressWrapper}>
        <svg height={radius * 2} width={radius * 2}>
          <circle
            stroke="#e6e6e6"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="#4caf50"
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: "stroke-dashoffset 0.5s",
            }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="18"
            fontWeight="bold"
            fill="#333"
          >
            {formatTime()}
          </text>
        </svg>
      </div>

      <div className={styles.status}>
        {onBreak ? "☕ On Break" : isRunning ? "🟢 Working" : "⚪ Not Working"}
      </div>

      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.actions}>
        <button
          disabled={!canPunchIn || loading}
          onClick={() => handleAction(punchInAPI, "punchIn")}
        >
          Punch In
        </button>

        <button
          disabled={!canPunchOut || loading}
          onClick={() => handleAction(punchOutAPI, "punchOut")}
        >
          Punch Out
        </button>

        <button
          disabled={!canBreakIn || loading}
          onClick={() => handleAction(breakInAPI, "breakIn")}
        >
          Break In
        </button>

        <button
          disabled={!canBreakOut || loading}
          onClick={() => handleAction(breakOutAPI, "breakOut")}
        >
          Break Out
        </button>
      </div>

      {loading && <p className={styles.loading}>Processing…</p>}
    </div>
  );
}
