import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAllEmployeesAttendanceAPI,
  getLiveEmployeesStatusAPI,
  getAllEmployeesAttendanceByDateRangeAPI,
  markAttendanceStatusAPI,
  downloadAttendancePDFWithPunchAPI,
  downloadAttendancePDFAPI,
} from "../../api/attendance.api";

import { FaUsers, FaCalendarDay, FaCalendarAlt } from "react-icons/fa";
import { IoChevronDown } from "react-icons/io5";

import styles from "./Attendance.module.css";
import toast from "react-hot-toast";
import Loader from "../../components/Loader/Loader";

export default function Attendance() {
  /* ================= DATES (IST SAFE) ================= */
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const [date, setDate] = useState(today);
  const [liveDate, setLiveDate] = useState(today);

  /* ================= STATE ================= */
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

  const liveFetchRef = useRef(null);
  const liveTickRef = useRef(null);

  const toggle = (k) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  /* ================= HELPERS ================= */
  const formatDateIST = (d) =>
    new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });

  const formatDuration = (s = 0) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}h ${String(
      Math.floor((s % 3600) / 60),
    ).padStart(2, "0")}m`;

  /* ================= DAILY ================= */
  const fetchDaily = async () => {
    try {
      setDailyLoading(true);
      const res = await getAllEmployeesAttendanceAPI(date);
      setDaily(res.data?.data || []);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setDailyLoading(false);
    }
  };

  useEffect(() => {
    if (open.daily) fetchDaily();
  }, [date, open.daily]);

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
    try {
      const res = await getLiveEmployeesStatusAPI(liveDate);
      setLive(res.data.data || []);
    } catch {
      toast.error("Failed to load live status");
    }
  };

  useEffect(() => {
    if (!open.live) return;

    fetchLive();

    liveFetchRef.current = setInterval(fetchLive, 60000);
    liveTickRef.current = setInterval(() => {
      setLive((prev) =>
        prev.map((e) => {
          if (e.status === "WORKING") {
            return { ...e, workedSeconds: e.workedSeconds + 1 };
          }
          if (e.status === "ON_BREAK") {
            return { ...e, breakSeconds: e.breakSeconds + 1 };
          }
          return e;
        }),
      );
    }, 1000);

    return () => {
      clearInterval(liveFetchRef.current);
      clearInterval(liveTickRef.current);
    };
  }, [open.live, liveDate]);

  /* ================= RANGE ================= */
  const fetchRange = async () => {
    if (!fromDate || !toDate) return toast.error("Select both dates");
    try {
      setRangeLoading(true);
      const res = await getAllEmployeesAttendanceByDateRangeAPI(
        fromDate,
        toDate,
      );
      setRange(res.data?.data || []);
    } finally {
      setRangeLoading(false);
    }
  };

  const employees = useMemo(() => {
    return Array.from(
      new Map(
        range.map((a) => [a.userId, { id: a.userId, name: a.name }]),
      ).values(),
    );
  }, [range]);

  const byDate = useMemo(() => {
    return range.reduce((acc, cur) => {
      const base = cur.punchIn || cur.date; // Prefer punch date
      const key = new Date(base).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      if (!acc[key]) acc[key] = {};

      // If duplicate exists, prefer PRESENT over LEAVE
      if (!acc[key][cur.userId]) {
        acc[key][cur.userId] = cur;
      } else {
        const prev = acc[key][cur.userId];
        if (prev.status === "LEAVE" && cur.status !== "LEAVE") {
          acc[key][cur.userId] = cur;
        }
      }

      return acc;
    }, {});
  }, [range]);

  /* ================= DOWNLOAD ================= */
  const download = async () => {
    if (!fromDate || !toDate) return toast.error("Select both dates");
    const api = downloadAttendancePDFAPI;

    const res = await api(fromDate, toDate);
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Attendance ${fromDate} to ${toDate}.pdf`;
    a.click();
  };

  /* ================= UI ================= */
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
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.headerRow}>Employee</th>
                        <th className={styles.headerRow}>Email</th>
                        <th className={styles.headerRow}>Status</th>
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
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      <th className={styles.headerRow}>Employee</th>
                      <th className={styles.headerRow}>Status</th>
                      <th className={styles.headerRow}>Worked</th>
                      <th className={styles.headerRow}>Break</th>
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
                  onClick={() => download(true)}
                  className={styles.primaryBtn}
                >
                  Download
                </button>
              </div>

              {rangeLoading ? (
                <Loader />
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.headerRow}>Date</th>
                        {employees.map((e) => (
                          <th key={e.id} className={styles.headerRow}>
                            {e.name}
                          </th>
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
                              {/* <small>
                                {rec[e.id]?.punchIn
                                  ? formatTime(rec[e.id].punchIn)
                                  : "--"}{" "}
                                -
                                {rec[e.id]?.punchOut
                                  ? formatTime(rec[e.id].punchOut)
                                  : "--"}
                              </small> */}
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
