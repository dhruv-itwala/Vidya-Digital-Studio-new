import { useEffect, useState } from "react";
import styles from "./DailyTimer.module.css";
import Loader from "../Loader/Loader";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function DailyTimer({ attendance }) {
  const {
    workSeconds,
    breakSeconds,
    isRunning,
    onBreak,
    punchedOut,
    actionLoading,
    WORK_TARGET_SECONDS,
    BREAK_LIMIT_SECONDS,
    punchIn,
    punchOut,
    breakIn,
    breakOut,
    reportSubmitted,
  } = attendance;

  /* ================= LOCAL LIVE TIMER ================= */
  const [liveWorkSeconds, setLiveWorkSeconds] = useState(workSeconds);

  const [liveBreakSeconds, setLiveBreakSeconds] = useState(breakSeconds);

  // Sync when server updates
  useEffect(() => {
    setLiveWorkSeconds(workSeconds);
  }, [workSeconds]);

  useEffect(() => {
    setLiveBreakSeconds(breakSeconds);
  }, [breakSeconds]);

  // Work ticking
  useEffect(() => {
    if (!isRunning || onBreak || punchedOut) return;

    const interval = setInterval(() => {
      setLiveWorkSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onBreak, punchedOut]);

  // Break ticking
  useEffect(() => {
    if (!onBreak || punchedOut) return;

    const interval = setInterval(() => {
      setLiveBreakSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [onBreak, punchedOut]);

  /* ================= HELPERS ================= */
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0",
    )}:${String(s).padStart(2, "0")}`;
  };

  const remainingWork = Math.max(WORK_TARGET_SECONDS - liveWorkSeconds, 0);
  const remainingBreak = Math.max(BREAK_LIMIT_SECONDS - liveBreakSeconds, 0);

  const progress = (remainingWork / WORK_TARGET_SECONDS) * 100;

  const shiftComplete = remainingWork === 0;

  const REPORT_WARNING_TIME = 30 * 60; // 30 minutes
  const showReportWarning =
    remainingWork <= REPORT_WARNING_TIME && !reportSubmitted && !punchedOut;

  /* ================= UI ================= */
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Today's Work Progress</h3>

      <div className={styles.progressWrapper}>
        <div className={styles.progressContainer}>
          <CircularProgressbar
            value={progress}
            text={formatTime(remainingWork)}
            styles={buildStyles({
              textSize: "12px",
              textWeight: "bold",
              pathColor: "var(--color-primary)",
              textColor: "#111",
              trailColor: "#e5e7eb",
            })}
          />
        </div>

        <div className={styles.status}>
          {punchedOut
            ? "✅ Shift Closed"
            : shiftComplete
              ? "🎉 Shift Complete"
              : onBreak
                ? "☕ On Break"
                : isRunning
                  ? "🟢 Working"
                  : "⚪ Not Working"}
          {onBreak && !punchedOut && (
            <div className={styles.breakInfo}>
              Break Remaining: {formatTime(remainingBreak)}
            </div>
          )}
          {/* REPORT WARNING */}
          {showReportWarning && (
            <p className={styles.warning}>
              ⚠ Please submit your daily report before punching out.
            </p>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          disabled={actionLoading || isRunning || onBreak || punchedOut}
          onClick={punchIn}
        >
          Punch In
        </button>

        <button
          disabled={actionLoading || !isRunning || onBreak || punchedOut}
          onClick={breakIn}
        >
          Break In
        </button>

        <button
          disabled={actionLoading || !onBreak || punchedOut}
          onClick={breakOut}
        >
          Break Out
        </button>

        <button
          disabled={
            actionLoading ||
            punchedOut ||
            (!isRunning && !onBreak) ||
            !reportSubmitted
          }
          onClick={punchOut}
        >
          Punch Out
        </button>
      </div>

      {actionLoading && <Loader />}
    </div>
  );
}
