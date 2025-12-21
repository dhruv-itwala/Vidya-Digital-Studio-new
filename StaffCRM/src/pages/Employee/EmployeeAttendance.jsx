import { useEffect, useState } from "react";
import { getMyAttendanceAPI } from "../../api/attendance.api";
import styles from "./EmployeeAttendance.module.css";
import { useAuth } from "../../context/AuthContext";
import HRAttendance from "./HRAttendance";

export default function EmployeeAttendance() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async () => {
    if (!fromDate || !toDate) return;

    try {
      setLoading(true);
      const res = await getMyAttendanceAPI({
        from: fromDate,
        to: toDate,
      });
      setRecords(res.data || []);
    } catch (err) {
      console.error("Failed to load attendance", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [fromDate, toDate]);

  return (
    <div className="masterContainer" style={{ flexDirection: "column" }}>
      <div className={styles.container}>
        <h2>My Attendance</h2>

        {/* DATE RANGE PICKER */}
        <div className={styles.filterRow}>
          <div>
            <label>From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div>
            <label>To</label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE */}
        <div className={styles.card}>
          {loading ? (
            <p className={styles.loading}>Loading...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="4" className={styles.empty}>
                      No records
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r._id}>
                      <td>{new Date(r.date).toISOString().split("T")[0]}</td>
                      <td
                        className={
                          styles[
                            `status${r.status.toLowerCase().replace("_", "")}`
                          ]
                        }
                      >
                        {r.status}
                      </td>
                      <td>
                        {r.sessions[0]?.in
                          ? new Date(r.sessions[0].in).toLocaleTimeString()
                          : "—"}
                      </td>
                      <td>
                        {r.sessions.at(-1)?.out
                          ? new Date(r.sessions.at(-1).out).toLocaleTimeString()
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {console.log(user)}
      {console.log(user)}
      {user && user.role == "hr" ? <HRAttendance /> : <p>Fail</p>}
    </div>
  );
}
