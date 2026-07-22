import { useEffect, useState } from "react";
import { getMyAttendanceAPI } from "../../api/attendance.api";
import Loader from "../../components/Loader/Loader";
import AttendanceCalendar from "../../components/Attendance/AttendanceCalendar";
import styles from "./EmployeeAttendance.module.css";

export default function EmployeeAttendance() {
  const [records, setRecords] = useState([]);
  const [loading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  /* ================= FETCH ================= */
  useEffect(() => {
    if (!(currentMonth instanceof Date) || isNaN(currentMonth.getTime())) {
      return;
    }

    const loadAttendance = async () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      const from = new Date(year, month, 1).toISOString();
      const to = new Date(year, month + 1, 0).toISOString();

      const res = await getMyAttendanceAPI({ from, to });
      setRecords(res.data.data || []);
    };

    loadAttendance();
  }, [currentMonth]);

  return (
    <div className="masterContainer">
      {loading ? (
        <Loader />
      ) : (
        <div className={styles.container}>
          <h2 className={styles.title}>My Attendence</h2>
          <AttendanceCalendar
            records={records}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </div>
      )}
    </div>
  );
}
