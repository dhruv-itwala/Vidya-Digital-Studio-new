import { useEffect, useRef, useState } from "react";
import {
  punchInAPI,
  punchOutAPI,
  breakInAPI,
  breakOutAPI,
  getTodayWorkRecordAPI,
} from "../../api/attendance.api";
import styles from "./EmployeeTimer.module.css";
import Loader from "../../components/Loader/Loader";

const WORK_TARGET_SECONDS = 8 * 60 * 60; // 8 hours

export default function EmployeeTimer({ onPunchIn, onPunchOutAttempt }) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const intervalRef = useRef(null);

  /* -------------------- Messages -------------------- */
  const getMessage = (type) =>
    ({
      punchIn: "Hey 👋 Have a great day 🚀",
      breakIn: "☕ Enjoy your break!",
      breakOut: "Welcome back! 💪",
      punchOut: "Great work today! 🌟",
    }[type]);

  /* -------------------- Backend Sync -------------------- */
  const syncFromServer = async () => {
    try {
      const res = await getTodayWorkRecordAPI();
      const record = res?.data;

      if (!record) {
        setSeconds(0);
        setIsRunning(false);
        setOnBreak(false);
        return;
      }

      setSeconds(record.liveNetSeconds);
      setIsRunning(record.isRunning);
      setOnBreak(record.onBreak);
    } catch (e) {
      console.error("Failed to sync from server:", e);
    }
  };

  /* -------------------- Timer -------------------- */
  useEffect(() => {
    clearInterval(intervalRef.current);

    if (isRunning && seconds < WORK_TARGET_SECONDS) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, seconds]);

  /* -------------------- Stop Timer at Shift End -------------------- */
  useEffect(() => {
    if (seconds >= WORK_TARGET_SECONDS) {
      setIsRunning(false);
    }
  }, [seconds]);

  /* -------------------- Initial Load -------------------- */
  useEffect(() => {
    syncFromServer();
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
      if (type === "punchIn") onPunchIn?.();
    } catch (e) {
      setMessage(e.message || "Action failed");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  /* -------------------- Helpers -------------------- */
  const remainingSeconds = Math.max(WORK_TARGET_SECONDS - seconds, 0);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  const progress = Math.min(
    (remainingSeconds / WORK_TARGET_SECONDS) * 100,
    100
  );

  const radius = 70;
  const stroke = 8;

  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  /* -------------------- Button States -------------------- */
  const shiftComplete = remainingSeconds === 0;

  const canPunchIn = !isRunning && !onBreak && !shiftComplete;
  const canPunchOut = isRunning && !shiftComplete;
  const canBreakIn = isRunning && !onBreak && !shiftComplete;
  const canBreakOut = onBreak && !shiftComplete;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Today’s Work Progress</h3>

      <div className={styles.timerStatusWrapper}>
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
              stroke="#0f5c44"
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
              fontSize="16"
              fontWeight="bold"
              fill="#1e293b"
            >
              {formatTime(remainingSeconds)}
            </text>
          </svg>
        </div>

        <div className={styles.statusMessageWrapper}>
          <span className={styles.statusText}>
            {shiftComplete
              ? "✅ Shift Complete"
              : onBreak
              ? "☕ On Break"
              : isRunning
              ? "🟢 Working"
              : "⚪ Not Working"}
          </span>
          {message && <span className={styles.message}>{message}</span>}
        </div>
      </div>

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

      {loading && <Loader />}
    </div>
  );
}
