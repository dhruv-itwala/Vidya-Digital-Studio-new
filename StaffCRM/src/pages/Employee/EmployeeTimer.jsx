import { useEffect, useRef, useState } from "react";
import {
  punchInAPI,
  punchOutAPI,
  breakInAPI,
  breakOutAPI,
  getMyAttendanceAPI,
} from "../../api/attendance.api";
import styles from "./EmployeeTimer.module.css";

const WORK_TARGET_SECONDS = 8 * 60 * 60; // 8 hours

export default function EmployeeTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const intervalRef = useRef(null);

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const getMessage = (type) => {
    const name = "Hey 👋"; // replace with actual user name if available

    const messages = {
      punchIn: `${name}! Hope you have a great day 🚀 You're officially working now.`,
      breakIn: `☕ Enjoy your break! You’ve earned it.`,
      breakOut: `Welcome back! 💪 Let’s finish strong.`,
      punchOut: `Great work today! 🌟 Don’t forget to submit your report.`,
    };

    return messages[type] || "";
  };

  /* ================= DERIVE STATE ================= */
  const deriveTimerState = (attendance) => {
    let totalSeconds = (attendance.totalMinutes || 0) * 60;
    let running = false;
    let breakActive = false;

    const lastSession = attendance.sessions?.at(-1);
    const lastBreak = attendance.breaks?.at(-1);

    if (lastSession && !lastSession.out) {
      if (lastBreak && !lastBreak.out) {
        breakActive = true;
      } else {
        totalSeconds += Math.floor(
          (Date.now() - new Date(lastSession.in)) / 1000
        );
        running = true;
      }
    }

    return { totalSeconds, running, breakActive };
  };

  /* ================= FETCH ================= */
  const syncFromServer = async (force = false) => {
    try {
      const res = await getMyAttendanceAPI({ from: today, to: today });

      if (!res.data?.length) {
        if (force) setSeconds(0);
        setIsRunning(false);
        setOnBreak(false);
        return;
      }

      const { totalSeconds, running, breakActive } = deriveTimerState(
        res.data[0]
      );

      // 🔒 Only overwrite seconds on FIRST LOAD or FORCED SYNC
      if (force) {
        setSeconds(totalSeconds);
      }

      setIsRunning(running);
      setOnBreak(breakActive);
    } catch {
      setMessage("Failed to sync attendance");
    }
  };

  /* ================= TIMER ================= */
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  useEffect(() => {
    syncFromServer(true); // ⬅️ force initial sync
    const poll = setInterval(() => syncFromServer(false), 30000);
    return () => clearInterval(poll);
  }, []);

  /* ================= ACTION ================= */
  const handleAction = async (api, type) => {
    try {
      setLoading(true);
      await api();

      await syncFromServer(false);

      setMessage(getMessage(type));
    } catch (e) {
      setMessage(e.message || "Action failed");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  /* ================= HELPERS ================= */
  const format = () => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  const progress = Math.min((seconds / WORK_TARGET_SECONDS) * 100, 100);

  const progressState =
    seconds >= WORK_TARGET_SECONDS
      ? styles.overtime
      : progress > 85
      ? styles.warning
      : styles.normal;

  /* ================= BUTTON STATES ================= */
  const canPunchIn = !isRunning && !onBreak;
  const canPunchOut = isRunning;
  const canBreakIn = isRunning && !onBreak;
  const canBreakOut = onBreak;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Today’s Work Progress</h3>

      {/* TIMER */}
      <div className={styles.timer}>{format()}</div>

      {/* PROGRESS BAR */}
      <div className={styles.progressWrapper}>
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${progressState}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={styles.progressMeta}>
          <span>0h</span>
          <span>8h</span>
        </div>
      </div>

      {/* STATUS */}
      <div className={styles.status}>
        {onBreak
          ? "☕ On Break"
          : isRunning
          ? "🟢 Working"
          : seconds >= WORK_TARGET_SECONDS
          ? "✅ Target Completed"
          : "⚪ Not Working"}
      </div>
      {message && <div className={styles.message}>{message}</div>}

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

      {loading && <p className={styles.loading}>Processing…</p>}
    </div>
  );
}
