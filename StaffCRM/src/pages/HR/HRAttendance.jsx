import React, { useEffect, useState } from "react";
import {
  getAllEmployeesAttendanceAPI,
  getAllEmployeesAttendanceByDateRangeAPI,
  downloadAttendancePDFAPI,
  getLiveEmployeesStatusAPI,
  markAttendanceStatusAPI,
  downloadAttendancePDFWithPunchAPI,
} from "../../api/attendance.api";

import styles from "./HRAttendance.module.css";
import toast from "react-hot-toast";
import Loader from "../../components/Loader/Loader";

import { FiChevronDown, FiUsers, FiActivity } from "react-icons/fi";

const HRAttendance = () => {
  const today = new Date().toISOString().split("T")[0];

  /* ================= DAILY ================= */
  const [date, setDate] = useState(today);
  const [dailyEmployees, setDailyEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= LIVE ================= */
  const [liveStatus, setLiveStatus] = useState([]);

  /* ================= RANGE ================= */
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rangeAttendance, setRangeAttendance] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);

  /* ================= ACCORDION ================= */
  const [open, setOpen] = useState({
    daily: true,
    live: true,
    range: true,
  });

  /* ================= DAILY FETCH ================= */
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await getAllEmployeesAttendanceAPI(date);
      setDailyEmployees(res.data || []);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  /* ================= UPDATE STATUS ================= */
  const handleStatusChange = async (id, status) => {
    try {
      await markAttendanceStatusAPI({ userId: id, date, status });
      setDailyEmployees((prev) =>
        prev.map((e) => (e._id === id ? { ...e, status } : e))
      );
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  /* ================= LIVE STATUS ================= */
  const fetchLiveStatus = async () => {
    const res = await getLiveEmployeesStatusAPI();
    setLiveStatus(res.data || []);
  };

  useEffect(() => {
    fetchLiveStatus();
    const i = setInterval(fetchLiveStatus, 60000);
    return () => clearInterval(i);
  }, []);

  /* ================= RANGE FETCH ================= */
  const fetchRangeAttendance = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both dates");
      return;
    }

    try {
      setRangeLoading(true);
      const res = await getAllEmployeesAttendanceByDateRangeAPI(
        fromDate,
        toDate
      );
      setRangeAttendance(res.data?.data || []);
    } catch {
      toast.error("Failed to load range attendance");
      setRangeAttendance([]);
    } finally {
      setRangeLoading(false);
    }
  };

  /* ================= DOWNLOAD PDF ================= */
  const downloadAttendancePDF = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both dates");
      return;
    }

    try {
      const res = await downloadAttendancePDFAPI(fromDate, toDate);
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = `Attendance Sheet ${fromDate} - ${toDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  const downloadAttendancePDFWithPunch = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both dates");
      return;
    }

    try {
      const res = await downloadAttendancePDFWithPunchAPI(fromDate, toDate);
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = `Punch Attendance ${fromDate} - ${toDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    }
  };
  /* ================= RANGE TABLE HELPERS ================= */
  const formatDateIST = (d) => new Date(d).toLocaleDateString("en-IN");

  const employees = Array.from(
    new Map(
      rangeAttendance.map((a) => [
        a.userId,
        { _id: a.userId, name: a.name, email: a.email },
      ])
    ).values()
  );

  const attendanceByDate = rangeAttendance.reduce((acc, curr) => {
    const dateKey = formatDateIST(curr.date);
    if (!acc[dateKey]) acc[dateKey] = {};
    acc[dateKey][curr.userId] = curr.status;
    return acc;
  }, {});

  const formatDuration = (s = 0) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(
      Math.floor((s % 3600) / 60)
    ).padStart(2, "0")}`;

  /* ================= RENDER ================= */
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2>
          <FiUsers /> HR Attendance
        </h2>
      </div>

      {/* ================= DAILY ================= */}
      <div className={styles.accordion}>
        <button
          className={styles.accordionHeader}
          onClick={() => setOpen((p) => ({ ...p, daily: !p.daily }))}
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
            <FiChevronDown className={open.daily ? styles.rotate : ""} />
          </div>
        </button>

        {open.daily && (
          <div className={styles.accordionBody}>
            {loading ? (
              <Loader />
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
                    {dailyEmployees.map((emp) => (
                      <tr key={emp._id}>
                        <td>{emp.name}</td>
                        <td className={styles.email}>{emp.email}</td>
                        <td>
                          <select
                            className={styles[emp.status?.toLowerCase()]}
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

      {/* ================= LIVE ================= */}
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
                    <th>Worked</th>
                  </tr>
                </thead>
                <tbody>
                  {liveStatus.map((emp) => (
                    <tr key={emp.userId}>
                      <td>{emp.name}</td>
                      <td className={styles[emp.status.toLowerCase()]}>
                        {emp.status.replace("_", " ")}
                      </td>
                      <td>{formatDuration(emp.workedSeconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ================= RANGE ================= */}
      <div className={styles.accordion}>
        <button
          className={styles.accordionHeader}
          onClick={() => setOpen((p) => ({ ...p, range: !p.range }))}
        >
          <span>📅 Attendance Summary (Date Range)</span>
          <FiChevronDown className={open.range ? styles.rotate : ""} />
        </button>

        {open.range && (
          <div className={styles.accordionBody}>
            <div className={styles.rangeFilters}>
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
                onClick={fetchRangeAttendance}
                className={styles.primaryBtn}
              >
                Get
              </button>
              <button
                onClick={downloadAttendancePDF}
                className={styles.primaryBtn}
              >
                Download
              </button>
              <button
                onClick={downloadAttendancePDFWithPunch}
                className={styles.primaryBtn}
              >
                Download with Punches
              </button>
            </div>

            {rangeLoading ? (
              <Loader />
            ) : (
              <div className={styles.tableWrapper}>
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
                    {Object.entries(attendanceByDate).map(([date, records]) => (
                      <tr key={date}>
                        <td>{date}</td>
                        {employees.map((emp) => (
                          <td
                            key={emp._id}
                            className={styles[records[emp._id]?.toLowerCase()]}
                          >
                            {records[emp._id] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HRAttendance;
