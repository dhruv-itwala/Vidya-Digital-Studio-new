import { useEffect, useState } from "react";
import {
  getDayAttendanceAPI,
  getLiveEmployeesStatusAPI,
  getAllEmployeesAttendanceByDateRangeAPI,
  downloadAttendancePDFAPI,
  downloadAttendancePDFWithPunchAPI,
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

  /* ================= STATE ================= */
  const [openSection, setOpenSection] = useState("live");

  const [date, setDate] = useState(today);
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  const [liveStatus, setLiveStatus] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rangeAttendance, setRangeAttendance] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);

  const toggleSection = (key) =>
    setOpenSection((prev) => (prev === key ? null : key));

  /* ================= HELPERS ================= */
  const formatDateIST = (d) => new Date(d).toLocaleDateString("en-IN");

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDuration = (seconds = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  };

  /* ================= DAILY ================= */
  const fetchDailyAttendance = async () => {
    try {
      setDailyLoading(true);
      const res = await getDayAttendanceAPI(date);
      setDailyAttendance(res.data || []);
    } catch {
      toast.error("Failed to load daily attendance");
      setDailyAttendance([]);
    } finally {
      setDailyLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyAttendance();
  }, [date]);

  /* ================= LIVE ================= */
  const fetchLiveStatus = async () => {
    try {
      setLiveLoading(true);
      const res = await getLiveEmployeesStatusAPI();
      setLiveStatus(res.data || []);
    } catch {
      toast.error("Failed to load live status");
      setLiveStatus([]);
    } finally {
      setLiveLoading(false);
    }
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

      // API may return { success, data }
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      setRangeAttendance(list);
    } catch {
      toast.error("Failed to load range attendance");
      setRangeAttendance([]);
    } finally {
      setRangeLoading(false);
    }
  };

  /* ================= DOWNLOAD ================= */
  const downloadPDF = async () => {
    if (!fromDate || !toDate) {
      toast.error("Select both dates");
      return;
    }

    try {
      const res = await downloadAttendancePDFAPI(fromDate, toDate);
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance_${fromDate}_to_${toDate}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  const downloadPDFWithPunch = async () => {
    if (!fromDate || !toDate) {
      toast.error("Select both dates");
      return;
    }

    try {
      const res = await downloadAttendancePDFWithPunchAPI(fromDate, toDate);
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance_with_punch_${fromDate}_to_${toDate}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  /* ================= RANGE MAPPING ================= */

  const employees = Array.from(
    new Map(
      rangeAttendance.map((a) => [a.userId, { userId: a.userId, name: a.name }])
    ).values()
  );

  const attendanceByDate = rangeAttendance.reduce((acc, curr) => {
    const dateKey = formatDateIST(curr.date);
    if (!acc[dateKey]) acc[dateKey] = {};
    acc[dateKey][curr.userId] = {
      status: curr.status,
      punchIn: curr.punchIn,
      punchOut: curr.punchOut,
    };
    return acc;
  }, {});

  /* ================= RENDER ================= */
  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <h2 className={styles.title}>Admin Attendance</h2>

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
              {liveLoading ? (
                <Loader />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Status</th>
                      <th>Worked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveStatus.map((e) => (
                      <tr key={e.userId}>
                        <td>{e.name}</td>
                        <td
                          className={
                            styles[
                              `status${e.status.toLowerCase().replace("_", "")}`
                            ]
                          }
                        >
                          {e.status.replace("_", " ")}
                        </td>
                        <td>{formatDuration(e.workedSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
              {dailyLoading ? (
                <Loader />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyAttendance.map((a) => (
                      <tr key={a._id}>
                        <td>{a.user?.name || "—"}</td>
                        <td
                          className={styles["status" + a.status?.toLowerCase()]}
                        >
                          {a.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
                  onClick={fetchRangeAttendance}
                  className={styles.primaryBtn}
                >
                  Get
                </button>
                <button onClick={downloadPDF} className={styles.primaryBtn}>
                  Download
                </button>
                <button
                  onClick={downloadPDFWithPunch}
                  className={styles.primaryBtn}
                >
                  Download with Punch
                </button>
              </div>

              {rangeLoading ? (
                <Loader />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      {employees.map((e) => (
                        <th key={e.userId}>{e.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(attendanceByDate).map(([date, records]) => (
                      <tr key={date}>
                        <td>{date}</td>
                        {employees.map((e) => {
                          const r = records[e.userId];
                          return (
                            <td key={e.userId}>
                              {r ? (
                                <>
                                  <div>{r.status}</div>
                                  <small>
                                    {r.punchIn ? formatTime(r.punchIn) : "--"} -{" "}
                                    {r.punchOut
                                      ? formatTime(r.punchOut)
                                      : r.status === "INCOMPLETE"
                                      ? "INC"
                                      : "--"}
                                  </small>
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
