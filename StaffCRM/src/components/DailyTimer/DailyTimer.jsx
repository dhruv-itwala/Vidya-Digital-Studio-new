import { useEffect, useState, useRef } from "react";
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
    punches = [],
    refresh,
  } = attendance;

  /* ================= LOCAL LIVE TIMER ================= */
  const [liveWorkSeconds, setLiveWorkSeconds] = useState(workSeconds);
  const [liveBreakSeconds, setLiveBreakSeconds] = useState(breakSeconds);

  // Wall-clock anchors to prevent timer drift when tab is inactive/throttled
  const workAnchorRef = useRef({ seconds: workSeconds, timestamp: Date.now() });
  const breakAnchorRef = useRef({ seconds: breakSeconds, timestamp: Date.now() });

  // Sync when server updates
  useEffect(() => {
    workAnchorRef.current = { seconds: workSeconds, timestamp: Date.now() };
    setLiveWorkSeconds(workSeconds);
  }, [workSeconds]);

  useEffect(() => {
    breakAnchorRef.current = { seconds: breakSeconds, timestamp: Date.now() };
    setLiveBreakSeconds(breakSeconds);
  }, [breakSeconds]);

  // Work ticking using elapsed wall-clock seconds
  useEffect(() => {
    if (!isRunning || onBreak || punchedOut) return;

    workAnchorRef.current = { seconds: liveWorkSeconds, timestamp: Date.now() };

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - workAnchorRef.current.timestamp) / 1000);
      setLiveWorkSeconds(workAnchorRef.current.seconds + elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onBreak, punchedOut]);

  // Break ticking using elapsed wall-clock seconds
  useEffect(() => {
    if (!onBreak || punchedOut) return;

    breakAnchorRef.current = { seconds: liveBreakSeconds, timestamp: Date.now() };

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - breakAnchorRef.current.timestamp) / 1000);
      setLiveBreakSeconds(breakAnchorRef.current.seconds + elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [onBreak, punchedOut]);

  // Auto-sync & catch-up when tab becomes active / visible again
  useEffect(() => {
    let lastWake = 0;
    const handleWakeUp = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        // Immediately catch-up local live timers to real-time wall-clock
        if (isRunning && !onBreak && !punchedOut && workAnchorRef.current) {
          const elapsed = Math.floor((now - workAnchorRef.current.timestamp) / 1000);
          setLiveWorkSeconds(workAnchorRef.current.seconds + elapsed);
        }
        if (onBreak && !punchedOut && breakAnchorRef.current) {
          const elapsed = Math.floor((now - breakAnchorRef.current.timestamp) / 1000);
          setLiveBreakSeconds(breakAnchorRef.current.seconds + elapsed);
        }

        // Throttle server refresh to avoid double-calling on simultaneous focus + visibilitychange
        if (now - lastWake > 2500) {
          lastWake = now;
          if (typeof refresh === "function") {
            refresh();
          }
        }
      }
    };

    window.addEventListener("focus", handleWakeUp);
    document.addEventListener("visibilitychange", handleWakeUp);

    return () => {
      window.removeEventListener("focus", handleWakeUp);
      document.removeEventListener("visibilitychange", handleWakeUp);
    };
  }, [isRunning, onBreak, punchedOut, refresh]);

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

  const formatSessionTime = (dateStr) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
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
            ? "⏸ Punched Out (Paused)"
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

      {punches && punches.length > 0 && (
        <div className={styles.sessionsTracker}>
          <div className={styles.sessionsTitle}>
            Today's Sessions ({punches.length})
          </div>
          <div className={styles.sessionsList}>
            {punches.map((p, idx) => {
              const inStr = formatSessionTime(p.in);
              const outStr = p.out ? formatSessionTime(p.out) : (isRunning ? "Active" : "--");
              return (
                <div key={idx} className={styles.sessionItem}>
                  <span>#{idx + 1}</span>
                  <span>{inStr} - {outStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button
          disabled={actionLoading || isRunning || onBreak}
          onClick={punchIn}
        >
          {punchedOut ? "Punch In Again" : "Punch In"}
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
            (!isRunning && !onBreak)
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
