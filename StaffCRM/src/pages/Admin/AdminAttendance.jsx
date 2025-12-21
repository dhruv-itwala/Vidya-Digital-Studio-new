import { useEffect, useState } from "react";
import { getDayAttendanceAPI } from "../../api/attendance.api";
import styles from "./AdminAttendance.module.css";

export default function AdminAttendance() {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await getDayAttendanceAPI(date);
      setAttendance(res.data || []);
    } catch (err) {
      console.error("Failed to fetch attendance", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <h2 className={styles.title}>Daily Attendance</h2>

        {/* DATE FILTER */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Select Date</h3>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* TABLE */}
          <div className={styles.tableContainer}>
            {loading ? (
              <p className={styles.loading}>Loading...</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan="4" className={styles.empty}>
                        No attendance found
                      </td>
                    </tr>
                  ) : (
                    attendance.map((a) => (
                      <tr key={a._id}>
                        <td>{a.user?.name || "—"}</td>
                        <td
                          className={
                            styles[
                              `status${a.status.toLowerCase().replace("_", "")}`
                            ]
                          }
                        >
                          {a.status}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
