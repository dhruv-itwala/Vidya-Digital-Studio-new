import { useEffect, useState } from "react";
import { getMyAttendanceAPI } from "../../api/attendance.api";
import styles from "./EmployeeAttendance.module.css";
import Loader from "../../components/Loader/Loader";
import toast from "react-hot-toast";

const getToday = () => new Date().toISOString().split("T")[0];

export default function EmployeeAttendance() {
  const [fromDate, setFromDate] = useState(getToday());
  const [toDate, setToDate] = useState(getToday());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select date range");
      return;
    }

    try {
      setLoading(true);
      const res = await getMyAttendanceAPI({
        from: fromDate,
        to: toDate,
      });

      const data = res.data || [];
      setRecords(data);

      if (data.length === 0) {
        toast("No attendance found for this range", { icon: "📭" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance");
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

        {/* Filters */}
        <div className={styles.filterRow}>
          <div>
            <label>From</label>
            <input
              type="date"
              value={fromDate}
              max={getToday()}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div>
            <label>To</label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              max={getToday()}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          {loading ? (
            <Loader />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="2" className={styles.empty}>
                      No records found
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
