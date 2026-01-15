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
import toast from "react-hot-toast";

/* ================= CONSTANTS ================= */
const WORK_TARGET_SECONDS = 8 * 60 * 60; // 8 hours
const WARNING_SECONDS = 7.5 * 60 * 60; // 7h 30m
const BREAK_LIMIT_SECONDS = 60 * 60; // 60 minutes

export default function EmployeeTimer({ onPunchIn, onPunchOutAttempt }) {
  /* ================= STATE ================= */
  const [workSeconds, setWorkSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);

  const [isRunning, setIsRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [hasPunchedOut, setHasPunchedOut] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");

  const workIntervalRef = useRef(null);
  const breakIntervalRef = useRef(null);

  /* ================= BACKEND SYNC ================= */
  const syncFromServer = async () => {
    try {
      const res = await getTodayWorkRecordAPI();
      const record = res?.data?.data;

      if (!record) {
        setWorkSeconds(0);
        setBreakSeconds(0);
        setIsRunning(false);
        setOnBreak(false);
        setHasPunchedOut(false);
        return;
      }

      setWorkSeconds(record.liveNetSeconds || 0);

      const breakSecs =
        record.breaks?.reduce((sum, b) => {
          if (!b.in) return sum;
          const end = b.out ? new Date(b.out) : new Date();
          return sum + Math.floor((end - new Date(b.in)) / 1000);
        }, 0) || 0;

      setBreakSeconds(breakSecs);
      setIsRunning(record.isRunning);
      setOnBreak(record.onBreak);
      setHasPunchedOut(!!record.punchOut);
    } catch (e) {
      console.error("Sync failed:", e);
      toast.error("Failed to sync attendance status");
    }
  };

  /* ================= WORK TIMER ================= */
  useEffect(() => {
    clearInterval(workIntervalRef.current);

    if (isRunning && !onBreak && workSeconds < WORK_TARGET_SECONDS) {
      workIntervalRef.current = setInterval(() => {
        setWorkSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(workIntervalRef.current);
  }, [isRunning, onBreak, workSeconds]);

  /* ================= BREAK TIMER ================= */
  useEffect(() => {
    clearInterval(breakIntervalRef.current);

    if (onBreak && breakSeconds < BREAK_LIMIT_SECONDS) {
      breakIntervalRef.current = setInterval(() => {
        setBreakSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(breakIntervalRef.current);
  }, [onBreak, breakSeconds]);

  /* ================= WARNINGS ================= */
  useEffect(() => {
    if (workSeconds >= WARNING_SECONDS && workSeconds < WORK_TARGET_SECONDS) {
      setWarning("⚠️ You have crossed 7h 30m. Please prepare to punch out.");
    } else if (workSeconds >= WORK_TARGET_SECONDS && !hasPunchedOut) {
      setWarning(
        "⚠️ 8 hours completed. Please punch out or attendance may be marked INCOMPLETE."
      );
      setIsRunning(false);
    } else {
      setWarning("");
    }
  }, [workSeconds, hasPunchedOut]);

  useEffect(() => {
    if (breakSeconds >= BREAK_LIMIT_SECONDS && onBreak) {
      setMessage("⚠️ Break limit (60 min) exceeded. Please resume work.");
    }
  }, [breakSeconds, onBreak]);

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    syncFromServer();
  }, []);

  /* ================= ACTION HANDLER ================= */
  const handleAction = async (api, type) => {
    if (
      type === "punchOut" &&
      onPunchOutAttempt &&
      !(await onPunchOutAttempt())
    ) {
      const msg = "⚠️ Submit your report before punching out.";
      toast.error(msg);
      setMessage(msg);
      return;
    }

    try {
      setLoading(true);
      await api();
      await syncFromServer();
      const successMsg = {
        punchIn: "👋 Have a great day!",
        breakIn: "☕ Break started",
        breakOut: "💪 Back to work",
        punchOut: "🌟 Great work today!",
      }[type];

      toast.success(successMsg);
      setMessage(successMsg);
    } catch (err) {
      const errorMsg =
        err?.message || err?.response?.data?.message || "Something went wrong";

      toast.error(errorMsg);
      setMessage(errorMsg);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  /* ================= HELPERS ================= */
  const remainingWork = Math.max(WORK_TARGET_SECONDS - workSeconds, 0);
  const remainingBreak = Math.max(BREAK_LIMIT_SECONDS - breakSeconds, 0);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  const progress = Math.min((remainingWork / WORK_TARGET_SECONDS) * 100, 100);

  const radius = 70;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  /* ================= BUTTON STATES ================= */
  const shiftComplete = remainingWork === 0;

  const canPunchIn = !isRunning && !onBreak && !hasPunchedOut;

  const canPunchOut = !hasPunchedOut && (isRunning || shiftComplete);

  const canBreakIn = isRunning && !onBreak && !hasPunchedOut;

  const canBreakOut = onBreak && !hasPunchedOut;

  /* ================= UI ================= */
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Today’s Work Progress</h3>

      <div className={styles.timerStatusWrapper}>
        {/* LEFT: CIRCLE */}
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
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
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
              {formatTime(remainingWork)}
            </text>
          </svg>
        </div>

        {/* RIGHT: STATUS */}
        <div className={styles.statusMessageWrapper}>
          <div className={styles.statusWrapper}>
            <span className={styles.statusText}>
              {hasPunchedOut
                ? "✅ Shift Closed"
                : shiftComplete
                ? "⛔ Shift Complete"
                : onBreak
                ? "☕ On Break"
                : isRunning
                ? "🟢 Working"
                : "⚪ Not Working"}
            </span>
          </div>

          {warning && <span className={styles.message}>{warning}</span>}

          {onBreak && !hasPunchedOut && (
            <span className={styles.status}>
              Break Remaining: {formatTime(remainingBreak)}
            </span>
          )}
        </div>
      </div>

      {/* ACTIONS */}
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
