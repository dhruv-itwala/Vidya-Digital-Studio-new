import { useEffect, useState } from "react";
import {
  getAllEmployeesAttendanceAPI,
  getLiveEmployeesStatusAPI,
  getAllEmployeesAttendanceByDateRangeAPI,
  markAttendanceStatusAPI,
  downloadAttendancePDFAPI,
  downloadAttendancePDFWithPunchAPI,
} from "../../api/attendance.api";

import { FaUsers, FaCalendarDay, FaCalendarAlt } from "react-icons/fa";
import { IoChevronDown } from "react-icons/io5";

import styles from "./Attendance.module.css";
import toast from "react-hot-toast";
import Loader from "../../components/Loader/Loader";

export default function Attendance() {
  const today = new Date().toISOString().split("T")[0];
  const [liveDate, setLiveDate] = useState(today);

  const [date, setDate] = useState(today);
  const [daily, setDaily] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  const [live, setLive] = useState([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [range, setRange] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);

  const [open, setOpen] = useState({
    daily: true,
    live: false,
    range: false,
  });

  const toggle = (k) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  /* ================= HELPERS ================= */
  const formatDateIST = (d) => new Date(d).toLocaleDateString("en-IN");
  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDuration = (s = 0) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}h ${String(
      Math.floor((s % 3600) / 60)
    ).padStart(2, "0")}m`;

  /* ================= DAILY ================= */
  const fetchDaily = async () => {
    try {
      setDailyLoading(true);
      const res = await getAllEmployeesAttendanceAPI(date);
      setDaily(res.data || []);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setDailyLoading(false);
    }
  };

  useEffect(() => {
    fetchDaily();
  }, [date]);

  const updateStatus = async (id, status) => {
    try {
      await markAttendanceStatusAPI({ userId: id, date, status });
      setDaily((p) => p.map((e) => (e._id === id ? { ...e, status } : e)));
      toast.success("Updated");
    } catch {
      toast.error("Update failed");
    }
  };

  /* ================= LIVE ================= */
  const fetchLive = async () => {
    const res = await getLiveEmployeesStatusAPI(liveDate);
    setLive(res.data || []);
  };

  useEffect(() => {
    fetchLive();
    const i = setInterval(fetchLive, 60000);
    return () => clearInterval(i);
  }, [liveDate]);

  useEffect(() => {
    const t = setInterval(() => {
      setLive((prev) =>
        prev.map((e) => {
          if (e.status === "WORKING") {
            return { ...e, workedSeconds: e.workedSeconds + 1 };
          }
          if (e.status === "ON_BREAK") {
            return { ...e, breakSeconds: e.breakSeconds + 1 };
          }

          return e;
        })
      );
    }, 1000);

    return () => clearInterval(t);
  }, []);

  /* ================= RANGE ================= */
  const fetchRange = async () => {
    if (!fromDate || !toDate) return toast.error("Select both dates");
    try {
      setRangeLoading(true);
      const res = await getAllEmployeesAttendanceByDateRangeAPI(
        fromDate,
        toDate
      );
      setRange(res.data?.data || []);
    } finally {
      setRangeLoading(false);
    }
  };

  const employees = Array.from(
    new Map(
      range.map((a) => [a.userId, { id: a.userId, name: a.name }])
    ).values()
  );

  const byDate = range.reduce((acc, cur) => {
    const key = formatDateIST(cur.date);
    if (!acc[key]) acc[key] = {};
    acc[key][cur.userId] = cur;
    return acc;
  }, {});

  /* ================= DOWNLOAD ================= */
  const download = async (withPunch) => {
    if (!fromDate || !toDate) return toast.error("Select both dates");
    const api = withPunch
      ? downloadAttendancePDFWithPunchAPI
      : downloadAttendancePDFAPI;
    const res = await api(fromDate, toDate);
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance.pdf";
    a.click();
  };

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <h2>Attendance</h2>

        {/* ================= DAILY ================= */}
        <div className={styles.accordion}>
          <button
            className={styles.accordionHeader}
            onClick={() => toggle("daily")}
          >
            <span>
              <FaCalendarDay /> Daily Attendance
            </span>
            <IoChevronDown className={open.daily ? styles.rotate : ""} />
          </button>

          {open.daily && (
            <div className={styles.accordionBody}>
              <input
                type="date"
                value={date}
                className={styles.dateInput}
                onChange={(e) => setDate(e.target.value)}
              />

              {dailyLoading ? (
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
                      {daily.map((e) => (
                        <tr key={e._id}>
                          <td>{e.name}</td>
                          <td className={styles.email}>{e.email}</td>
                          <td>
                            <select
                              value={e.status}
                              className={styles[e.status?.toLowerCase()]}
                              onChange={(ev) =>
                                updateStatus(e._id, ev.target.value)
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
            onClick={() => toggle("live")}
          >
            <span>
              <FaUsers /> Live Workforce
            </span>
            <IoChevronDown className={open.live ? styles.rotate : ""} />
          </button>

          {open.live && (
            <div className={styles.accordionBody}>
              <input
                type="date"
                value={liveDate}
                onChange={(e) => setLiveDate(e.target.value)}
              />

              <div className={styles.tableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Status</th>
                      <th>Worked</th>
                      <th>Break</th>
                    </tr>
                  </thead>
                  <tbody>
                    {live.map((e) => (
                      <tr key={e.userId}>
                        <td>{e.name}</td>
                        <td
                          className={
                            styles[e.status?.toLowerCase().replace("_", "")]
                          }
                        >
                          {e.status === "NOT_STARTED"
                            ? "Not Started"
                            : e.status === "WORKING"
                            ? "Working"
                            : e.status === "ON_BREAK"
                            ? "On Break"
                            : "Completed"}
                        </td>
                        <td>{formatDuration(e.workedSeconds)}</td>
                        <td>{formatDuration(e.breakSeconds)}</td>
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
            onClick={() => toggle("range")}
          >
            <span>
              <FaCalendarAlt /> Attendance Summary
            </span>
            <IoChevronDown className={open.range ? styles.rotate : ""} />
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

                <button onClick={fetchRange} className={styles.primaryBtn}>
                  Get
                </button>
                <button
                  onClick={() => download(false)}
                  className={styles.primaryBtn}
                >
                  Download
                </button>
                <button
                  onClick={() => download(true)}
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
                          <th key={e.id}>{e.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(byDate).map(([d, rec]) => (
                        <tr key={d}>
                          <td>{d}</td>
                          {employees.map((e) => (
                            <td key={e.id}>
                              {rec[e.id]?.status || "—"}
                              <br />
                              <small>
                                {rec[e.id]?.punchIn
                                  ? formatTime(rec[e.id].punchIn)
                                  : "--"}{" "}
                                -
                                {rec[e.id]?.punchOut
                                  ? formatTime(rec[e.id].punchOut)
                                  : "--"}
                              </small>
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
    </div>
  );
}
