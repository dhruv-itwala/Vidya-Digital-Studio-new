import { useEffect, useState, useRef } from "react";
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
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatSessionTime = (dateStr) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
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
    statusText = "PUNCHED OUT (PAUSED)";
    statusClass = styles.punchedOut;
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

      {/* CIRCULAR PROGRESS BAR */}
      <div className={styles.progressContainer}>
        <svg className={styles.progressSvg} viewBox="0 0 200 200">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F5C44" />
              <stop offset="100%" stopColor="#0F5C44" />
            </linearGradient>
            <linearGradient id="overtimeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          
          <circle
            className={styles.progressBg}
            cx="100"
            cy="100"
            r="85"
          />
          <circle
            className={styles.progressCircle}
            cx="100"
            cy="100"
            r="85"
            style={{
              strokeDasharray: 2 * Math.PI * 85,
              strokeDashoffset: (2 * Math.PI * 85) * Math.min(liveWorkSeconds / WORK_TARGET_SECONDS, 1),
              stroke: remainingWork === 0 ? "url(#overtimeGradient)" : "url(#progressGradient)"
            }}
          />
        </svg>

        <div className={styles.progressContent}>
          <div className={styles.timerDisplay}>
            {remainingWork === 0 && liveWorkSeconds > WORK_TARGET_SECONDS ? (
               <span style={{ color: "#ea580c", fontSize: "0.6em", display: "block" }}>OVERTIME</span>
            ) : null}
            {remainingWork === 0 && liveWorkSeconds > WORK_TARGET_SECONDS 
              ? formatTime(liveWorkSeconds - WORK_TARGET_SECONDS) 
              : formatTime(remainingWork)}
          </div>
          <div className={styles.progressLabel}>
            {remainingWork === 0 && liveWorkSeconds > WORK_TARGET_SECONDS ? "EXTRA WORKED" : "REMAINING"}
          </div>
        </div>
      </div>

      <div className={`${styles.statusLabel} ${statusClass}`}>
        {statusText}
      </div>

      <div className={styles.statsPill}>
        <div className={styles.statRowGreen}>
          Total Worked: {formatTime(liveWorkSeconds)} • Target: {formatTime(WORK_TARGET_SECONDS)}
        </div>
        <div className={styles.statRowOrange}>
          Break Quota: {formatTime(BREAK_LIMIT_SECONDS)} • Remaining: {formatTime(remainingBreak)}
        </div>
      </div>

      {punches && punches.length > 0 && (
        <div className={styles.sessionsTracker}>
          <div className={styles.sessionsHeader}>
            <span className={styles.sessionsTitle}>Today's Punch Sessions ({punches.length})</span>
          </div>
          <div className={styles.sessionsList}>
            {punches.map((p, idx) => {
              const inStr = formatSessionTime(p.in);
              const outStr = p.out ? formatSessionTime(p.out) : (isRunning ? "Active Now" : "--");
              const isCurrent = !p.out && isRunning;
              return (
                <div key={idx} className={`${styles.sessionItem} ${isCurrent ? styles.activeSession : ""}`}>
                  <span className={styles.sessionBadge}>Session #{idx + 1}</span>
                  <span className={styles.sessionTimes}>
                    {inStr} → {outStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showReportWarning && (
        <p className={styles.warning}>
          ⚠ Please submit your daily report before punching out.
        </p>
      )}

      <div className={styles.actions}>
        {!isRunning && !onBreak && (
          <button
            className={styles.punchInBtn}
            disabled={actionLoading}
            onClick={punchIn}
          >
            {punchedOut ? "PUNCH IN AGAIN" : "PUNCH IN"}
          </button>
        )}

        {isRunning && !onBreak && !punchedOut && (
          <>
            <button
              className={styles.punchOutBtn}
              disabled={actionLoading}
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
