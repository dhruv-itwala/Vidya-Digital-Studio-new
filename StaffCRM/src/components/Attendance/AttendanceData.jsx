import { useEffect, useState } from "react";
import { getMyAttendanceAPI } from "../../api/attendance.api";
import styles from "./Attendance.module.css";

export default function AttendanceData() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await getMyAttendanceAPI();
    setData(res.data.slice(0, 45));
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Attendance History</h2>

      {data.length === 0 ? (
        <div className={styles.empty}>No attendance records found</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Punch In</th>
              <th>Breaks</th>
              <th>Punch Out</th>
              <th>Total (mins)</th>
            </tr>
          </thead>

          <tbody>
            {data.map((a) => (
              <tr key={a._id}>
                <td className={styles.date}>{a.date}</td>

                <td className={styles.time}>
                  {a.punchIn ? new Date(a.punchIn).toLocaleTimeString() : "-"}
                </td>

                <td>
                  <div className={styles.breakBox}>
                    {a.breaks.length === 0 && <span>-</span>}

                    {a.breaks.map((b, i) => (
                      <div key={i} className={styles.breakRow}>
                        {new Date(b.breakIn).toLocaleTimeString()} –{" "}
                        {b.breakOut ? (
                          new Date(b.breakOut).toLocaleTimeString()
                        ) : (
                          <span className={styles.running}>Running</span>
                        )}
                      </div>
                    ))}
                  </div>
                </td>

                <td className={styles.time}>
                  {a.punchOut ? new Date(a.punchOut).toLocaleTimeString() : "-"}
                </td>

                <td className={styles.total}>{a.totalMinutes ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
