import { useEffect, useState } from "react";
import {
  getAllEmployeesAttendanceByDateRangeAPI,
  getDayAttendanceAPI,
} from "../../api/attendance.api";

import styles from "./AdminAttendance.module.css";

export default function AdminAttendance() {
  const today = new Date().toISOString().split("T")[0];
  const formatDateIST = (utcDate) => {
    if (!utcDate) return "—";

    return new Date(utcDate).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const [date, setDate] = useState(today);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rangeAttendance, setRangeAttendance] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);

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

  /* ================= FETCH RANGE ================= */
  const fetchAllAttendanceByRange = async () => {
    if (!fromDate || !toDate) return;

    try {
      setRangeLoading(true);
      const res = await getAllEmployeesAttendanceByDateRangeAPI(
        fromDate,
        toDate
      );
      setRangeAttendance(res.data || []);
    } catch (err) {
      console.error("Failed to fetch attendance by range", err);
    } finally {
      setRangeLoading(false);
    }
  };

  // unique employees
  const employees = Array.from(
    new Map(
      rangeAttendance
        .filter((a) => a.user?._id)
        .map((a) => [a.user._id, a.user])
    ).values()
  );

  // group attendance by date
  const attendanceByDate = rangeAttendance.reduce((acc, curr) => {
    const dateKey = formatDateIST(curr.date);

    if (!acc[dateKey]) acc[dateKey] = {};
    acc[dateKey][curr.user?._id] = curr.status;

    return acc;
  }, {});

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

        {/* RANGE FILTER */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>All Employees Attendance (Date Range)</h3>
          </div>

          <div className={styles.filters}>
            <input
              type="date"
              value={fromDate}
              max={today}
              onChange={(e) => setFromDate(e.target.value)}
            />

            <input
              type="date"
              value={toDate}
              min={fromDate}
              max={today}
              onChange={(e) => setToDate(e.target.value)}
            />

            <button
              onClick={fetchAllAttendanceByRange}
              className={styles.primaryBtn}
            >
              Fetch
            </button>
          </div>

          <div className={styles.tableContainer}>
            {rangeLoading ? (
              <p className={styles.loading}>Loading...</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    {employees.map((emp) => (
                      <th key={emp._id}>{emp.name}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {Object.keys(attendanceByDate).length === 0 ? (
                    <tr>
                      <td
                        colSpan={employees.length + 1}
                        className={styles.empty}
                      >
                        No attendance found
                      </td>
                    </tr>
                  ) : (
                    Object.entries(attendanceByDate).map(([date, records]) => (
                      <tr key={date}>
                        <td>{date}</td>

                        {employees.map((emp) => {
                          const status = records[emp._id] || "—";

                          return (
                            <td
                              key={emp._id}
                              className={
                                status !== "—"
                                  ? styles[
                                      `status${status
                                        .toLowerCase()
                                        .replace("_", "")}`
                                    ]
                                  : ""
                              }
                            >
                              {status}
                            </td>
                          );
                        })}
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
