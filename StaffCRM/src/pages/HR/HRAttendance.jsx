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
import { FaCalendarAlt } from "react-icons/fa";

const HRAttendance = () => {
  const today = new Date().toISOString().split("T")[0];

  /* ================= STATE ================= */
  const [date, setDate] = useState(today);
  const [dailyEmployees, setDailyEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [liveStatus, setLiveStatus] = useState([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rangeAttendance, setRangeAttendance] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);

  const [open, setOpen] = useState({
    daily: true,
    live: true,
    range: true,
  });

  /* ================= DAILY ================= */
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

  /* ================= LIVE ================= */
  const fetchLiveStatus = async () => {
    const res = await getLiveEmployeesStatusAPI();
    setLiveStatus(res.data || []);
  };

  useEffect(() => {
    fetchLiveStatus();
    const i = setInterval(fetchLiveStatus, 60000);
    return () => clearInterval(i);
  }, []);

  /* ================= RANGE ================= */
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

  /* ================= DOWNLOAD ================= */
  const downloadAttendancePDF = async () => {
    if (!fromDate || !toDate) return toast.error("Select both dates");
    const res = await downloadAttendancePDFAPI(fromDate, toDate);
    const url = URL.createObjectURL(
      new Blob([res.data], { type: "application/pdf" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `Attendance_${fromDate}_${toDate}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAttendancePDFWithPunch = async () => {
    if (!fromDate || !toDate) return toast.error("Select both dates");
    const res = await downloadAttendancePDFWithPunchAPI(fromDate, toDate);
    const url = URL.createObjectURL(
      new Blob([res.data], { type: "application/pdf" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `Punch_Attendance_${fromDate}_${toDate}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /* ================= HELPERS ================= */
  const formatDateIST = (d) => new Date(d).toLocaleDateString("en-IN");
  const formatDuration = (s = 0) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(
      Math.floor((s % 3600) / 60)
    ).padStart(2, "0")}`;

  const employees = Array.from(
    new Map(
      rangeAttendance.map((a) => [a.userId, { _id: a.userId, name: a.name }])
    ).values()
  );

  const attendanceByDate = rangeAttendance.reduce((acc, curr) => {
    const key = formatDateIST(curr.date);
    if (!acc[key]) acc[key] = {};
    acc[key][curr.userId] = curr.status;
    return acc;
  }, {});

  /* ================= UI ================= */
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
            <FiChevronDown className={open.daily ? styles.rotate : ""} />
          </div>
        </button>

        {open.daily && (
          <div className={styles.accordionBody}>
            {loading ? (
              <Loader />
            ) : (
              <>
                {" "}
                <input
                  type="date"
                  className={styles.dateInput}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
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
                              value={emp.status}
                              className={styles[emp.status?.toLowerCase()]}
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
              </>
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
            <FiActivity /> Live Status
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
          <span>
            <FaCalendarAlt /> Attendance Summary
          </span>
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
                Download with Punch
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
                      {employees.map((e) => (
                        <th key={e._id}>{e.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(attendanceByDate).map(([d, rec]) => (
                      <tr key={d}>
                        <td>{d}</td>
                        {employees.map((e) => (
                          <td
                            key={e._id}
                            className={styles[rec[e._id]?.toLowerCase()]}
                          >
                            {rec[e._id] || "—"}
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
