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
import toast from "react-hot-toast";
import { getHolidaysAPI } from "../../api/holiday.api";
import { getAllLeavesAPI } from "../../api/leave.api";

const EmployeeDashboard = () => {
  const [punchInDone, setPunchInDone] = useState(false);
  const [punchedOut, setPunchedOut] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [birthdays, setBirthdays] = useState([]);

  const [isLeave, setIsLeave] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayName, setHolidayName] = useState("");

  const [isWeekend, setIsWeekend] = useState(false);
  const [istDay, setIstDay] = useState(null);

  // ------------------ IST Helpers ------------------
  const getISTDateObj = () =>
    new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

  const getISTDateString = (date = new Date()) =>
    new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
      .toISOString()
      .split("T")[0];

  // ------------------ Main API Load ------------------
  const fetchStatus = async () => {
    setLoading(true);

    try {
      const istDate = getISTDateObj();
      const todayIST = getISTDateString(istDate);
      const day = istDate.getDay();

      setIstDay(day);

      // ---------- Birthday (parallel safe) ----------
      getEmployeeBirthdaysAPI()
        .then((res) => {
          const todayDay = istDate.getDate();
          const todayMonth = istDate.getMonth() + 1;

          const todayBirthdays =
            res?.data?.filter((emp) => {
              const dob = new Date(emp.dateOfBirth);
              return (
                dob.getDate() === todayDay && dob.getMonth() + 1 === todayMonth
              );
            }) || [];

          setBirthdays(todayBirthdays);
        })
        .catch(() => setBirthdays([]));

      // ---------- Holiday ----------
      const holidayRes = await getHolidaysAPI();
      const holidays = holidayRes?.data?.data || [];

      const todayHoliday = holidays.find(
        (h) => getISTDateString(new Date(h.date)) === todayIST
      );

      if (todayHoliday) {
        setIsHoliday(true);
        setHolidayName(todayHoliday.name || "Holiday");
        return;
      }

      setIsHoliday(false);
      setHolidayName("");

      // ---------- Leave ----------
      const leaveRes = await getAllLeavesAPI();
      const leaves = leaveRes?.data?.data || [];

      const todayLeave = leaves.find((leave) => {
        if (leave.status !== "APPROVED") return false;

        const fromIST = getISTDateString(new Date(leave.fromDate));
        const toIST = getISTDateString(new Date(leave.toDate));

        return todayIST >= fromIST && todayIST <= toIST;
      });

      if (todayLeave) {
        setIsLeave(true);
        return;
      }

      setIsLeave(false);

      // ---------- Weekend ----------
      const isWeekendToday = [0, 6].includes(day);
      setIsWeekend(isWeekendToday);

      // ---------- Attendance / Work / Report ----------
      const [attendanceRes, recordRes, reportRes] = await Promise.all([
        getMyAttendanceByDateAPI(todayIST),
        getTodayWorkRecordAPI(),
        getMyReportsByDateAPI(),
      ]);

      setPunchInDone(!!recordRes?.data?.data?.punchIn);
      setPunchedOut(!!recordRes?.data?.data?.punchOut);
      setReportSubmitted(Boolean(reportRes?.data?.data));
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Failed to load dashboard");
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
