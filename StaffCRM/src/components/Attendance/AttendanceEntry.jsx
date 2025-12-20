import { useEffect, useRef, useState } from "react";
import {
  punchInAPI,
  breakStartAPI,
  breakEndAPI,
  punchOutAPI,
  getMyAttendanceAPI,
} from "../../api/attendance.api";
import ReportModal from "./ReportModal";
import { formatSeconds } from "../../utils/time.util";
import { useAuth } from "../../context/AuthContext";
import styles from "./Attendance.module.css";

export default function AttendanceEntry() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [status, setStatus] = useState("IDLE");
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    init();
    return stopTimer;
  }, []);

  const init = async () => {
    const res = await getMyAttendanceAPI();
    const today = res.data[0];
    if (!today) return;

    setAttendance(today);

    if (today.punchOut) {
      setStatus("DONE");
      return;
    }

    if (today.punchIn) {
      const lastBreak = today.breaks.at(-1);
      if (lastBreak && !lastBreak.breakOut) {
        setStatus("BREAK");
      } else {
        setStatus("WORKING");
        startTimer(today);
      }
    }
  };

  const startTimer = (data) => {
    stopTimer();

    let elapsed = (Date.now() - new Date(data.punchIn)) / 1000;

    data.breaks.forEach((b) => {
      if (b.breakOut) {
        elapsed -= (new Date(b.breakOut) - new Date(b.breakIn)) / 1000;
      }
    });

    setSeconds(Math.floor(elapsed));

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ACTIONS
  const punchIn = async () => {
    const res = await punchInAPI();
    setAttendance(res.data);
    setStatus("WORKING");
    startTimer(res.data);
  };

  const breakStart = async () => {
    await breakStartAPI();
    stopTimer();
    setStatus("BREAK");
  };

  const breakEnd = async () => {
    const res = await breakEndAPI();
    setAttendance({ ...res.data, justResumed: true });
    setStatus("WORKING");
    startTimer(res.data);

    setTimeout(() => {
      setAttendance((a) => ({ ...a, justResumed: false }));
    }, 5000);
  };

  const punchOutFlow = () => {
    stopTimer();
    setStatus("REPORT");
  };

  const confirmPunchOut = async () => {
    await punchOutAPI();
    stopTimer();
    setStatus("DONE");
  };

  const getGreeting = (status, userName) => {
    const hour = new Date().getHours();

    if (status === "BREAK") return "Enjoy your break buddy ☕";
    if (status === "WORKING" && attendance?.justResumed)
      return `Welcome back, ${userName}`;

    if (hour < 12) return `Good Morning, ${userName}`;
    return `Good Afternoon, ${userName}`;
  };

  const getGoodbyeText = () => {
    const day = new Date().getDay(); // 0 Sun, 5 Fri
    return day === 5
      ? "Thank you, see you on Monday 👋"
      : "Thank you, see you tomorrow 👋";
  };

  // FINAL UI
  if (status === "DONE") {
    return (
      <div className={styles.done}>
        <h2>{getGoodbyeText()}</h2>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardCompact}>
        <div className={styles.header}>
          <span className={styles.greeting}>
            {getGreeting(status, user.name)}
          </span>
        </div>

        {status !== "DONE" && (
          <div className={styles.timerSmall}>{formatSeconds(seconds)}</div>
        )}

        <div className={styles.actionsCompact}>
          {status === "IDLE" && (
            <button className={styles.primary} onClick={punchIn}>
              Punch In
            </button>
          )}

          {status === "WORKING" && (
            <>
              <button onClick={breakStart}>Break</button>
              <button className={styles.danger} onClick={punchOutFlow}>
                Punch Out
              </button>
            </>
          )}

          {status === "BREAK" && (
            <button className={styles.primary} onClick={breakEnd}>
              Resume
            </button>
          )}
        </div>

        {status === "DONE" && (
          <div className={styles.goodbye}>{getGoodbyeText()}</div>
        )}
      </div>

      {status === "REPORT" && (
        <ReportModal
          onCancel={() => setStatus("WORKING")}
          onSubmit={() => setStatus("CONFIRM")}
        />
      )}

      {status === "CONFIRM" && (
        <div className={styles.confirm}>
          <p>
            Are you sure you want to punch out?
            <br />
            This action cannot be reversed.
          </p>
          <button onClick={confirmPunchOut}>Yes, Punch Out</button>
          <button onClick={() => setStatus("WORKING")}>Cancel</button>
        </div>
      )}
    </div>
  );
}
