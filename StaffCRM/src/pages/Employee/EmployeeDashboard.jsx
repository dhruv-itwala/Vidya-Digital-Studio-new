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
import Loader from "../../components/Loader/Loader";
import WeekendCard from "../../components/Cards/WeekendCard";
import LeaveCard from "../../components/Cards/LeaveCard";
import HolidayCard from "../../components/Cards/HolidayCard";
import BirthdayCard from "../../components/Cards/BirthdayCard";
import { getEmployeeBirthdaysAPI } from "../../api/admin.api";

const EmployeeDashboard = () => {
  const [punchInDone, setPunchInDone] = useState(false);
  const [punchedOut, setPunchedOut] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [birthdays, setBirthdays] = useState([]);

  const [isLeave, setIsLeave] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayName, setHolidayName] = useState("");

  const getISTDay = () => {
    const now = new Date();
    const istTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    return istTime.getDay();
  };

  const istDay = getISTDay();
  const isWeekend = [0, 6].includes(istDay);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
      /* -------------------- 1️⃣ Attendance Check -------------------- */
      const attendanceRes = await getMyAttendanceByDateAPI(today);
      const attendance = attendanceRes?.data;

      /* -------------------- 🎂 Birthday Check -------------------- */
      try {
        const bdayRes = await getEmployeeBirthdaysAPI();
        setBirthdays(bdayRes.data || []);
      } catch {
        setBirthdays([]);
      }

      if (attendance?.status === "HOLIDAY") {
        setIsHoliday(true);
        setHolidayName(attendance.remarks || "Holiday");
        return; // ⛔ stop further dashboard logic
      }

      if (attendance?.status === "LEAVE") {
        setIsLeave(true);
        return; // ⛔ stop further dashboard logic
      }

      setIsLeave(false);
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

  if (loading) return <Loader />;

  if (isHoliday) {
    return <HolidayCard holidayName={holidayName} />;
  }

  if (isLeave) {
    return <LeaveCard />;
  }

  if (isWeekend) {
    return <WeekendCard day={istDay} />;
  }

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {birthdays.length > 0 && <BirthdayCard people={birthdays} />}

        <div className={styles.topRow}>
          <EmployeeTimer
            onPunchIn={handlePunchIn}
            onPunchOutAttempt={handlePunchOutAttempt}
            onPunchOut={handlePunchOutSuccess}
          />

          <EmployeeReport onSubmitted={handleReportSubmitted} />
        </div>

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
