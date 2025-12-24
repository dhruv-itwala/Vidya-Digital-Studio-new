import React, { useEffect, useState } from "react";
import {
  getAllEmployeesAttendanceAPI,
  getLiveEmployeesStatusAPI,
  markAttendanceStatusAPI,
} from "../../api/attendance.api";
import styles from "./HRAttendance.module.css";
import toast from "react-hot-toast";

import { FiChevronDown, FiCalendar, FiUsers, FiActivity } from "react-icons/fi";

const HRAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [employees, setEmployees] = useState([]);
  const [liveStatus, setLiveStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState({
    attendance: true,
    live: true,
  });

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await getAllEmployeesAttendanceAPI(date);
      setEmployees(res.data);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const handleStatusChange = async (id, status) => {
    try {
      await markAttendanceStatusAPI({ userId: id, date, status });
      setEmployees((prev) =>
        prev.map((e) => (e._id === id ? { ...e, status } : e))
      );
      toast.success("Status updated");
    } catch {
      toast.error("Update failed");
    }
  };

  const fetchLiveStatus = async () => {
    const res = await getLiveEmployeesStatusAPI();
    setLiveStatus(res.data || []);
  };

  useEffect(() => {
    fetchLiveStatus();
    const i = setInterval(fetchLiveStatus, 60000);
    return () => clearInterval(i);
  }, []);

  const formatDuration = (s = 0) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(
      Math.floor((s % 3600) / 60)
    ).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <h2>
          <FiUsers /> HR Attendance
        </h2>
      </div>

      {/* Attendance Accordion */}
      <div className={styles.accordion}>
        <button
          className={styles.accordionHeader}
          onClick={() => setOpen((p) => ({ ...p, attendance: !p.attendance }))}
        >
          <span>
            <FiUsers /> Attendance
          </span>
          <div>
            <input
              className={styles.dateInput}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <FiChevronDown className={open.attendance ? styles.rotate : ""} />
          </div>
        </button>

        {open.attendance && (
          <div className={styles.accordionBody}>
            {loading ? (
              <p className={styles.loading}>Loading...</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp._id}>
                        <td>{emp.name}</td>
                        <td className={styles.email}>{emp.email}</td>
                        <td>
                          <select
                            value={emp.status}
                            onChange={(e) =>
                              handleStatusChange(emp._id, e.target.value)
                            }
                          >
                            <option value="PRESENT">Present</option>
                            <option value="HALF_DAY">Half Day</option>
                            <option value="WFH">WFH</option>
                            <option value="ABSENT">Absent</option>
                            <option value="LEAVE">Leave</option>
                            <option value="HOLIDAY">Holiday</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Status Accordion */}
      <div className={styles.accordion}>
        <button
          className={styles.accordionHeader}
          onClick={() => setOpen((p) => ({ ...p, live: !p.live }))}
        >
          <span>
            <FiActivity /> Live Employee Status
          </span>
          <FiChevronDown className={open.live ? styles.rotate : ""} />
        </button>

        {open.live && (
          <div className={styles.accordionBody}>
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Status</th>
                    <th>Worked Time</th>
                  </tr>
                </thead>
                <tbody>
                  {liveStatus.length === 0 ? (
                    <tr>
                      <td colSpan="3" className={styles.empty}>
                        No data available
                      </td>
                    </tr>
                  ) : (
                    liveStatus.map((emp) => (
                      <tr key={emp.userId}>
                        <td>{emp.name}</td>
                        <td className={styles.liveStatus}>
                          {emp.status.replace("_", " ")}
                        </td>
                        <td>{formatDuration(emp.workedSeconds)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRAttendance;
