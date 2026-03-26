import { useState, useEffect } from "react";
import styles from "./HROverride.module.css";
import {
  hrOverrideAttendanceAPI,
  getWorkRecordByDateAPI,
  getMyAttendanceByDateAPI,
} from "../../api/attendance.api";
import { useAuth } from "../../context/AuthContext";

const HROverride = () => {
  const { allEmployees } = useAuth();
  console.log(allEmployees);
  const [selectedUser, setSelectedUser] = useState("");
  const [date, setDate] = useState("");

  const [form, setForm] = useState({
    punchIn: "",
    punchOut: "",
    breaks: [],
    status: "PRESENT",
  });

  const [loading, setLoading] = useState(false);

  /* ================= FETCH DATA ================= */

  const fetchData = async () => {
    if (!selectedUser || !date) return;

    try {
      setLoading(true);

      const [workRes, attRes] = await Promise.all([
        getWorkRecordByDateAPI(selectedUser, date),
        getMyAttendanceByDateAPI(date), // ⚠️ replace with admin version if needed
      ]);

      const work = workRes?.data?.data;
      const att = attRes?.data?.data;

      setForm({
        punchIn: toDatetimeLocal(work?.punchIn),
        punchOut: toDatetimeLocal(work?.punchOut),
        breaks:
          work?.breaks?.map((b) => ({
            in: toDatetimeLocal(b.in),
            out: toDatetimeLocal(b.out),
          })) || [],
        status: att?.status || "ABSENT",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedUser, date]);

  /* ================= HANDLE ================= */

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await hrOverrideAttendanceAPI({
        userId: selectedUser,
        date,
        punchIn: form.punchIn ? new Date(form.punchIn).toISOString() : null,
        punchOut: form.punchOut ? new Date(form.punchOut).toISOString() : null,
        breaks: form.breaks,
        status: form.status,
      });

      alert("✅ Updated successfully");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toDatetimeLocal = (utcDate) => {
    if (!utcDate) return "";

    const date = new Date(utcDate);

    // Convert to IST manually
    const istOffset = 5.5 * 60; // minutes
    const istTime = new Date(date.getTime() + istOffset * 60000);

    return istTime.toISOString().slice(0, 16);
  };
  /* ================= UI ================= */

  return (
    <div className={styles.container}>
      <h2>HR Override Panel</h2>

      {/* USER SELECT */}
      <select
        value={selectedUser}
        onChange={(e) => setSelectedUser(e.target.value)}
      >
        <option value="">Select Employee</option>
        {allEmployees.map((u) => (
          <option key={u._id} value={u._id}>
            {u.name}
          </option>
        ))}
      </select>

      {/* DATE */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {/* FORM */}
      {selectedUser && date && (
        <div className={styles.card}>
          <h3>Edit Work Record</h3>

          <div className={styles.row}>
            <input
              type="datetime-local"
              value={form.punchIn}
              onChange={(e) => updateField("punchIn", e.target.value)}
            />
            <input
              type="datetime-local"
              value={form.punchOut}
              onChange={(e) => updateField("punchOut", e.target.value)}
            />
          </div>

          <select
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
          >
            <option value="PRESENT">Present</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="WFH">WFH</option>
            <option value="ABSENT">Absent</option>
            <option value="LEAVE">Leave</option>
          </select>

          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
};

export default HROverride;
