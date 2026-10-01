import { useEffect, useState } from "react";
import { getMyAttendanceAPI } from "../../api/attendance.api";
import Loader from "../../components/Loader/Loader";
import AttendanceCalendar from "../../components/Attendance/AttendanceCalendar";
import styles from "./EmployeeAttendance.module.css";
import toast from "react-hot-toast";

export default function EmployeeAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  /* ================= FETCH ================= */
  useEffect(() => {
    if (!(currentMonth instanceof Date) || isNaN(currentMonth.getTime())) {
      return;
    }

    let isMounted = true;
    const loadAttendance = async () => {
      setLoading(true);
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const from = new Date(year, month, 1).toISOString();
        const to = new Date(year, month + 1, 0).toISOString();

        const res = await getMyAttendanceAPI({ from, to });
        if (isMounted) setRecords(res.data.data || []);
      } catch (err) {
        if (isMounted) {
          toast.error(err?.response?.data?.message || err?.message || "Failed to load attendance");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAttendance();
    return () => {
      isMounted = false;
    };
  }, [currentMonth]);

  return (
    <div className="masterContainer">
      {loading ? (
        <Loader />
      ) : (
        <div className={styles.container}>
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
