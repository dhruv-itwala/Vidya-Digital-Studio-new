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
import TaskDashboard from "../Tasks/TaskDashboard";

const Dashboard = () => {
  const { user, role, birthdays, allEmployees } = useAuth();

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

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className={styles.bentoContainer}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeText}>
          <h2>Welcome back, {user?.name || "User"} 👋</h2>
          <p>Live overview of Vidya Digital Studio operations.</p>
        </div>
        <div className={styles.dateBadge}>
          {/* <span className={styles.dateIcon}>📅</span> */}
          <span className={styles.fullDate}>{todayDate}</span>
        </div>
      </div>

      {/* Birthdays */}
      {birthdays?.length > 0 && (
        <div className={styles.bentoFull}>
          <BirthdayCard people={birthdays} />
        </div>
      )}

      {/* Top Grid */}
      <div className={styles.bentoGridTop}>
        <div className={styles.bentoBox}>
          <DailyTimer attendance={attendance} />
        </div>
        <div className={styles.bentoBox}>
          <WeeklyHrs attendance={attendance} />
        </div>
      </div>

      <div className={styles.bentoGridTop}>
        <div className={styles.bentoBox}>
          <EmployeeReport onSubmitted={attendance.refresh} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
