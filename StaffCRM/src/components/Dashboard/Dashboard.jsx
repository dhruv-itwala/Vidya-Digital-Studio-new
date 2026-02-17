import React from "react";
import styles from "./Dashboard.module.css";

import Loader from "../../components/Loader/Loader";
import HolidayCard from "../../components/Cards/HolidayCard";
import BirthdayCard from "../../components/Cards/BirthdayCard";
import WeeklyHrs from "../../components/WeeklyHrs/WeeklyHrs";

import DailyTimer from "../../components/DailyTimer/DailyTimer";

import { useAttendance } from "../../hooks/useAttendance";
import { useAuth } from "../../context/AuthContext";
import EmployeeReport from "../../pages/Employee/EmployeeReport";
import EmployeeTasks from "../../pages/Employee/EmployeeTasks";
import TaskDashboard from "../Tasks/TaskDashboard";

const Dashboard = () => {
  const { role, birthdays, allEmployees } = useAuth();

  const attendance = useAttendance();

  /* ================= LOADING & SPECIAL DAYS ================= */

  if (attendance.loading) return <Loader />;

  if (attendance.isHoliday) {
    return <HolidayCard holidayName={attendance.holidayName} />;
  }

  if (attendance.isLeave) {
    return (
      <div className={styles.centerMessage}>🌴 You are on Leave Today</div>
    );
  }

  if (attendance.isWeekend) {
    return (
      <div className={styles.centerMessage}>🎉 Weekend — Enjoy Your Day!</div>
    );
  }

  /* ================= MAIN DASHBOARD ================= */

  return (
    <div className="masterContainer">
      <div className={styles.wrapper}>
        {/* Birthdays */}
        {birthdays?.length > 0 && <BirthdayCard people={birthdays} />}
        {/* Top Grid */}
        <div className={styles.grid}>
          <DailyTimer attendance={attendance} />

          <WeeklyHrs attendance={attendance} />

          <EmployeeReport onSubmitted={attendance.refresh} />
        </div>

        {attendance.isRunning &&
          !attendance.punchedOut &&
          (role === "employee" ? (
            <TaskDashboard role="employee" users={allEmployees} />
          ) : (
            <TaskDashboard role="hr" users={allEmployees} />
          ))}
      </div>
    </div>
  );
};

export default Dashboard;
