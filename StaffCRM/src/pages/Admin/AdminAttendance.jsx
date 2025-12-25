import { useEffect, useState } from "react";
import {
  downloadAttendancePDFAPI,
  getAllEmployeesAttendanceByDateRangeAPI,
  getDayAttendanceAPI,
  getLiveEmployeesStatusAPI,
} from "../../api/attendance.api";

import { FaUsers, FaCalendarDay, FaCalendarAlt } from "react-icons/fa";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

import styles from "./AdminAttendance.module.css";
import toast from "react-hot-toast";
import Loader from "../../components/Loader/Loader";

/* ================= ACCORDION HEADER ================= */
const AccordionHeader = ({
  title,
  icon: Icon,
  sectionKey,
  openSection,
  toggle,
}) => (
  <div className={styles.accordionHeader} onClick={() => toggle(sectionKey)}>
    <div className={styles.headerLeft}>
      <Icon className={styles.headerIcon} />
      <h3>{title}</h3>
    </div>

    {openSection === sectionKey ? <IoChevronUp /> : <IoChevronDown />}
  </div>
);

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

  /* ================= STATE ================= */
  const [openSection, setOpenSection] = useState("live");

  const [date, setDate] = useState(today);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rangeAttendance, setRangeAttendance] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);

  const [liveStatus, setLiveStatus] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);

  const toggleSection = (key) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  const formatDuration = (seconds = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${String(h).padStart(2, "0")} hrs ${String(m).padStart(
      2,
      "0"
    )} mins`;
  };

  /* ================= FETCH DAILY ================= */
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await getDayAttendanceAPI(date);
      setAttendance(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  /* ================= LIVE STATUS ================= */
  const fetchLiveStatus = async () => {
    try {
      setLiveLoading(true);
      const res = await getLiveEmployeesStatusAPI();
      setLiveStatus(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLiveLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  /* ================= RANGE ================= */
  const fetchAllAttendanceByRange = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both From and To dates");
      return;
    }
    try {
      setRangeLoading(true);
      const res = await getAllEmployeesAttendanceByDateRangeAPI(
        fromDate,
        toDate
      );
      setRangeAttendance(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRangeLoading(false);
    }
  };

  const downloadAttendancePDF = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both From and To dates");
      return;
    }

    try {
      const res = await downloadAttendancePDFAPI(fromDate, toDate);

      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance_${fromDate}_to_${toDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Failed to download PDF");
    }
  };

  /* ================= RENDER ================= */
  const employees = Array.from(
    new Map(
      rangeAttendance
        .filter((a) => a.user?._id)
        .map((a) => [a.user._id, a.user])
    ).values()
  );

  const attendanceByDate = rangeAttendance.reduce((acc, curr) => {
    const dateKey = formatDateIST(curr.date);
    if (!acc[dateKey]) acc[dateKey] = {};
    acc[dateKey][curr.user?._id] = curr.status;
    return acc;
  }, {});

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <h2 className={styles.title}>Attendance Management</h2>

        {/* ================= LIVE ================= */}
        <div className={styles.card}>
          <AccordionHeader
            title="Live Workforce Overview"
            icon={FaUsers}
            sectionKey="live"
            openSection={openSection}
            toggle={toggleSection}
          />

          {openSection === "live" && (
            <div className={styles.accordionBody}>
              <div className={styles.tableContainer}>
                {liveLoading ? (
                  <Loader />
                ) : (
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
                            No data
                          </td>
                        </tr>
                      ) : (
                        liveStatus.map((emp) => (
                          <tr key={emp.userId}>
                            <td>{emp.name}</td>
                            <td
                              className={
                                styles[
                                  `status${emp.status
                                    .toLowerCase()
                                    .replace("_", "")}`
                                ]
                              }
                            >
                              {emp.status.replace("_", " ")}
                            </td>
                            <td>{formatDuration(emp.workedSeconds)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================= DAILY ================= */}
        <div className={styles.card}>
          <AccordionHeader
            title="Daily Attendance"
            icon={FaCalendarDay}
            sectionKey="daily"
            openSection={openSection}
            toggle={toggleSection}
          />

          {openSection === "daily" && (
            <div className={styles.accordionBody}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

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
                          <td colSpan="2" className={styles.empty}>
                            No data
                          </td>
                        </tr>
                      ) : (
                        attendance.map((a) => (
                          <tr key={a._id}>
                            <td>{a.user?.name || "—"}</td>
                            <td
                              className={
                                styles[
                                  `status${a.status
                                    .toLowerCase()
                                    .replace("_", "")}`
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
          )}
        </div>

        {/* ================= RANGE ================= */}
        <div className={styles.card}>
          <AccordionHeader
            title="Attendance Summary (Date Range)"
            icon={FaCalendarAlt}
            sectionKey="range"
            openSection={openSection}
            toggle={toggleSection}
          />

          {openSection === "range" && (
            <div className={styles.accordionBody}>
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
                  Get
                </button>
                <button
                  onClick={downloadAttendancePDF}
                  className={styles.primaryBtn}
                >
                  Download
                </button>
              </div>

              <div className={styles.tableContainer}>
                {rangeLoading ? (
                  <Loader />
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
                            No data
                          </td>
                        </tr>
                      ) : (
                        Object.entries(attendanceByDate).map(
                          ([date, records]) => (
                            <tr key={date}>
                              <td>{date}</td>
                              {employees.map((emp) => (
                                <td
                                  key={emp._id}
                                  className={
                                    records[emp._id]
                                      ? styles[
                                          `status${records[emp._id]
                                            .toLowerCase()
                                            .replace("_", "")}`
                                        ]
                                      : ""
                                  }
                                >
                                  {records[emp._id] || "—"}
                                </td>
                              ))}
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
