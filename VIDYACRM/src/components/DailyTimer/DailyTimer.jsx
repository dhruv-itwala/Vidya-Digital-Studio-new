import { useEffect, useState } from "react";
import styles from "./DailyTimer.module.css";
import Loader from "../Loader/Loader";
import { FiSquare, FiClock } from "react-icons/fi";

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
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const remainingWork = Math.max(WORK_TARGET_SECONDS - liveWorkSeconds, 0);
  const remainingBreak = Math.max(BREAK_LIMIT_SECONDS - liveBreakSeconds, 0);

  const REPORT_WARNING_TIME = 30 * 60; // 30 minutes
  const showReportWarning =
    remainingWork <= REPORT_WARNING_TIME && !reportSubmitted && !punchedOut;

  /* ================= UI LOGIC ================= */
  let statusText = "NOT WORKING";
  let statusClass = styles.notWorking;

  if (punchedOut) {
    statusText = "SHIFT CLOSED";
    statusClass = styles.shiftClosed;
  } else if (onBreak) {
    statusText = "ON BREAK (WORK PAUSED)";
    statusClass = styles.onBreak;
  } else if (isRunning) {
    statusText = "WORK TIMER RUNNING";
    statusClass = styles.working;
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>LIVE CRM ATTENDANCE TIMER</h3>

      <div className={styles.timerDisplay}>
        {formatTime(liveWorkSeconds)}
      </div>

      <div className={`${styles.statusLabel} ${statusClass}`}>
        {statusText}
      </div>

      <div className={styles.statsPill}>
        <div className={styles.statRowGreen}>
          Target Work: {formatTime(WORK_TARGET_SECONDS)} • Remaining: {formatTime(remainingWork)}
        </div>
        <div className={styles.statRowOrange}>
          Break Quota: {formatTime(BREAK_LIMIT_SECONDS)} • Remaining: {formatTime(remainingBreak)}
        </div>
      </div>

      {showReportWarning && (
        <p className={styles.warning}>
          ⚠ Please submit your daily report before punching out.
        </p>
      )}

      <div className={styles.actions}>
        {!isRunning && !punchedOut && (
          <button
            className={styles.punchInBtn}
            disabled={actionLoading}
            onClick={punchIn}
          >
            PUNCH IN
          </button>
        )}

        {isRunning && !onBreak && !punchedOut && (
          <>
            <button
              className={styles.punchOutBtn}
              disabled={actionLoading || !reportSubmitted}
              onClick={punchOut}
            >
              <FiSquare className={styles.btnIcon} /> PUNCH OUT
            </button>
            <button
              className={styles.breakInBtn}
              disabled={actionLoading}
              onClick={breakIn}
            >
              <FiClock className={styles.btnIcon} /> BREAK IN (PAUSE WORK)
            </button>
          </>
        )}

        {onBreak && !punchedOut && (
          <button
            className={styles.breakOutBtn}
            disabled={actionLoading}
            onClick={breakOut}
          >
            <FiClock className={styles.btnIcon} /> BREAK OUT (RESUME WORK)
          </button>
        )}
      </div>

      {actionLoading && <div className={styles.loadingOverlay}><Loader /></div>}
    </div>
  );
}
