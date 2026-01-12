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

  // ------------------ IST Helpers ------------------
  const getISTDateObj = () => {
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
  };

  const istDate = getISTDateObj();
  const istDay = istDate.getDay();
  const isWeekend = [0, 6].includes(istDay);

  // ------------------ Main API Load ------------------
  const fetchStatus = async () => {
    try {
      setLoading(true);

      const today = istDate.toISOString().split("T")[0]; // YYYY-MM-DD

      // ---------- Attendance ----------
      const attendanceRes = await getMyAttendanceByDateAPI(today);
      const attendance = attendanceRes?.data;

      // ---------- Birthday ----------
      try {
        const bdayRes = await getEmployeeBirthdaysAPI();
        const allBirthdays = bdayRes?.data || [];

        const todayDay = istDate.getDate();
        const todayMonth = istDate.getMonth() + 1;

        const todayBirthdays = allBirthdays.filter((emp) => {
          const dob = new Date(emp.dateOfBirth);
          return (
            dob.getDate() === todayDay && dob.getMonth() + 1 === todayMonth
          );
        });

        setBirthdays(todayBirthdays);
        console.log(birthdays);
      } catch (e) {
        setBirthdays([]);
      }

      // ---------- Holiday / Leave ----------
      if (attendance?.status === "HOLIDAY") {
        setIsHoliday(true);
        setHolidayName(attendance.remarks || "Holiday");
        return;
      }

      if (attendance?.status === "LEAVE") {
        setIsLeave(true);
        return;
      }

      setIsLeave(false);
      setIsHoliday(false);

      // ---------- Work Record ----------
      const recordRes = await getTodayWorkRecordAPI();
      const record = recordRes?.data;

      setPunchInDone(!!record?.punchIn);
      setPunchedOut(!!record?.punchOut);

      // ---------- Report ----------
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

  // ------------------ Handlers ------------------
  const handlePunchIn = () => setPunchInDone(true);

  const handlePunchOutAttempt = async () => reportSubmitted;

  const handleReportSubmitted = () => setReportSubmitted(true);

  const handlePunchOutSuccess = () => setPunchedOut(true);

  // ------------------ UI ------------------
  if (loading) return <Loader />;

  if (isHoliday) return <HolidayCard holidayName={holidayName} />;

  if (isLeave) return <LeaveCard />;

  if (isWeekend) return <WeekendCard day={istDay} />;

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
