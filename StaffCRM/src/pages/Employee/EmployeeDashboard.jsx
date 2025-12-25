import React, { useState, useEffect } from "react";
import EmployeeTimer from "./EmployeeTimer";
import EmployeeReport from "./EmployeeReport";
import EmployeeTasks from "./EmployeeTasks";
import styles from "./EmployeeDashboard.module.css";
import {
  getMyAttendanceByDateAPI,
  getTodayWorkRecordAPI,
} from "../../api/attendance.api";
import { getMyReportsByDateAPI } from "../../api/report.api";
import HolidayCard from "./holidayCard";

const EmployeeDashboard = () => {
  const [punchInDone, setPunchInDone] = useState(false);
  const [punchedOut, setPunchedOut] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayName, setHolidayName] = useState("");

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
      /* -------------------- 1️⃣ Attendance Check -------------------- */
      const attendanceRes = await getMyAttendanceByDateAPI(today);
      const attendance = attendanceRes?.data;

      if (attendance?.status === "HOLIDAY") {
        setIsHoliday(true);
        setHolidayName(attendance.remarks || "Holiday");
        return; // ⛔ stop further dashboard logic
      }

      setIsHoliday(false);
      /* -------------------- 1️⃣ Work Record -------------------- */
      const recordRes = await getTodayWorkRecordAPI();
      const record = recordRes?.data;

      if (record) {
        setPunchInDone(!!record.punchIn);
        setPunchedOut(!!record.punchOut);
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

  if (isHoliday) {
    return <HolidayCard holidayName={holidayName} />;
  }

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

        {/* {punchInDone && !reportSubmitted && (
          <p className={styles.infoText}>
            ⚠️ You need to submit the daily report before Punch Out.
          </p>
        )} */}

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
