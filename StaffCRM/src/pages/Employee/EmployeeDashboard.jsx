import React, { useState, useEffect } from "react";
import EmployeeTimer from "./EmployeeTimer";
import EmployeeReport from "./EmployeeReport";
import EmployeeTasks from "./EmployeeTasks";
import styles from "./EmployeeDashboard.module.css";
import { getMyAttendanceByDateAPI } from "../../api/attendance.api";
import { getMyReportsByDateAPI } from "../../api/report.api";

const EmployeeDashboard = () => {
  const [punchInDone, setPunchInDone] = useState(false);
  const [punchedOut, setPunchedOut] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);

      /* -------------------- 1️⃣ Attendance Status -------------------- */
      const attendanceRes = await getMyAttendanceByDateAPI();
      const todayAttendance = attendanceRes?.data; // ✅ FIXED

      if (todayAttendance) {
        const sessions = todayAttendance.sessions || [];

        // punched in if any session exists
        setPunchInDone(sessions.length > 0);

        // punched out if last session has out time
        const lastSession = sessions.at(-1);
        setPunchedOut(!!lastSession?.out);
      } else {
        setPunchInDone(false);
        setPunchedOut(false);
      }

      /* -------------------- 2️⃣ Report Status -------------------- */
      const reportRes = await getMyReportsByDateAPI();
      setReportSubmitted(Boolean(reportRes?.data));
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handlePunchIn = () => {
    setPunchInDone(true);
  };

  const handlePunchOutAttempt = async () => {
    if (!reportSubmitted) return false;
    return true;
  };

  const handleReportSubmitted = () => {
    setReportSubmitted(true);
  };

  const handlePunchOutSuccess = () => {
    setPunchedOut(true);
  };

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <div className={styles.topRow}>
          <EmployeeTimer
            onPunchIn={handlePunchIn}
            onPunchOutAttempt={handlePunchOutAttempt}
            onPunchOut={handlePunchOutSuccess}
          />

          <EmployeeReport onSubmitted={handleReportSubmitted} />
        </div>

        {punchInDone && !reportSubmitted && (
          <p className={styles.infoText}>
            ⚠️ You need to submit the daily report before Punch Out.
          </p>
        )}

        {punchInDone && (
          <EmployeeTasks
            showTasks={punchInDone}
            disableTasksAfterPunchOut={punchedOut}
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
