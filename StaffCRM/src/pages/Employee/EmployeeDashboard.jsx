import React, { useState, useEffect } from "react";
import EmployeeTimer from "./EmployeeTimer";
import EmployeeReport from "./EmployeeReport";
import EmployeeTasks from "./EmployeeTasks";
import styles from "./EmployeeDashboard.module.css";
import { getTodayWorkRecordAPI } from "../../api/attendance.api";
import { getMyReportsByDateAPI } from "../../api/report.api";
import Loader from "../../components/Loader/Loader";
import HolidayCard from "../../components/Cards/HolidayCard";
import BirthdayCard from "../../components/Cards/BirthdayCard";
import toast from "react-hot-toast";
import { getHolidaysAPI } from "../../api/holiday.api";
import { getAllLeavesAPI } from "../../api/leave.api";
import WeeklyHrs from "../../components/WeeklyHrs/WeeklyHrs";
import { useAuth } from "../../context/AuthContext";
import { useAttendance } from "../../hooks/useAttendance";

const EmployeeDashboard = () => {
  const { birthdays } = useAuth();
  const attendance = useAttendance();
  const [state, setState] = useState({
    loading: true,
    punchInDone: false,
    punchedOut: false,
    reportSubmitted: false,
    isLeave: false,
    isHoliday: false,
    holidayName: "",
    isWeekend: false,
    istDay: null,
  });

  // ---------- IST helpers ----------
  const getISTDateObj = () =>
    new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

  const getISTDateString = (date) =>
    new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
      .toISOString()
      .split("T")[0];

  const fetchStatus = async () => {
    try {
      const istDate = getISTDateObj();
      const todayIST = getISTDateString(istDate);
      const day = istDate.getDay();
      const isWeekendToday = [0, 6].includes(day);

      // 🔹 Run Holiday + Leave together
      const [holidayRes, leaveRes] = await Promise.all([
        getHolidaysAPI(),
        getAllLeavesAPI(),
      ]);

      // ---------- Holiday ----------
      const holidays = holidayRes?.data?.data || [];
      const todayHoliday = holidays.find(
        (h) => getISTDateString(new Date(h.date)) === todayIST,
      );

      if (todayHoliday) {
        setState((prev) => ({
          ...prev,
          loading: false,
          isHoliday: true,
          holidayName: todayHoliday.name || "Holiday",
          istDay: day,
        }));
        return;
      }

      // ---------- Leave ----------
      const leaves = leaveRes?.data?.data || [];
      const todayLeave = leaves.find((leave) => {
        if (leave.status !== "APPROVED") return false;

        const fromIST = getISTDateString(new Date(leave.fromDate));
        const toIST = getISTDateString(new Date(leave.toDate));

        return todayIST >= fromIST && todayIST <= toIST;
      });

      if (todayLeave) {
        setState((prev) => ({
          ...prev,
          loading: false,
          isLeave: true,
          istDay: day,
        }));
        return;
      }

      // ---------- Weekend ----------
      if (isWeekendToday) {
        setState((prev) => ({
          ...prev,
          loading: false,
          isWeekend: true,
          istDay: day,
        }));
        return;
      }

      // ---------- Attendance / Work / Report (parallel) ----------
      const [recordRes, reportRes] = await Promise.all([
        getTodayWorkRecordAPI(),
        getMyReportsByDateAPI(),
      ]);

      setState((prev) => ({
        ...prev,
        loading: false,
        istDay: day,
        punchInDone: !!recordRes?.data?.data?.punchIn,
        punchedOut: !!recordRes?.data?.data?.punchOut,
        reportSubmitted: Boolean(reportRes?.data?.data),
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard");
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // ---------- UI ----------
  if (state.loading) return <Loader />;
  if (state.isHoliday) return <HolidayCard holidayName={state.holidayName} />;
  // if (state.isLeave) return <LeaveCard />;
  // if (state.isWeekend) return <WeekendCard day={state.istDay} />;

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {Array.isArray(birthdays) && birthdays.length > 0 && (
          <BirthdayCard people={birthdays} />
        )}

        <div className={styles.topRow}>
          <EmployeeTimer
            onPunchIn={() => setState((p) => ({ ...p, punchInDone: true }))}
            onPunchOutAttempt={() => state.reportSubmitted}
            onPunchOut={() => setState((p) => ({ ...p, punchedOut: true }))}
          />
          <WeeklyHrs attendance={attendance} />
          <EmployeeReport
            onSubmitted={() =>
              setState((p) => ({ ...p, reportSubmitted: true }))
            }
          />
        </div>

        {state.punchInDone && (
          <EmployeeTasks
            showTasks
            disableTasksAfterPunchOut={state.punchedOut}
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
