import { useState, useEffect } from "react";
import styles from "./HROverride.module.css";
import {
  hrOverrideAttendanceAPI,
  getWorkRecordByDateAPI,
  getMyAttendanceByDateAPI,
} from "../../api/attendance.api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import Loader from "../Loader/Loader";

const HROverride = () => {
  const { allEmployees } = useAuth();
  const [selectedUser, setSelectedUser] = useState("");
  const [date, setDate] = useState("");

  const [form, setForm] = useState({
    punchIn: "",
    punchOut: "",
    breaks: [],
    status: "PRESENT",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  /* ================= FETCH DATA ================= */

  const fetchData = async () => {
    if (!selectedUser || !date) return;

    try {
      setFetching(true);

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
      toast.error("Failed to fetch records for this date");
    } finally {
      setFetching(false);
    }
  };

  const updateBreak = (index, key, value) => {
    const updated = [...form.breaks];
    updated[index][key] = value;
    setForm((prev) => ({ ...prev, breaks: updated }));
  };

  const addBreak = () => {
    setForm((prev) => ({
      ...prev,
      breaks: [...prev.breaks, { in: "", out: "" }],
    }));
  };

  const removeBreak = (index) => {
    const updated = form.breaks.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, breaks: updated }));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        breaks: form.breaks.map((b) => ({
          in: b.in ? new Date(b.in).toISOString() : null,
          out: b.out ? new Date(b.out).toISOString() : null,
        })),
        status: form.status,
      });

      toast.success("Updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
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
    <div className="masterContainer">
      <div className={styles.container}>
        <h2 className={styles.title}>HR Override Panel</h2>

        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label>Select Employee</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className={styles.input}
            >
              <option value="">-- Select --</option>
              {allEmployees.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={styles.input}
            />
          </div>
        </div>

        {fetching ? (
          <Loader />
        ) : selectedUser && date ? (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Edit Work Record</h3>

            <div className={styles.row}>
              <div className={styles.filterGroup}>
                <label>Punch In</label>
                <input
                  type="datetime-local"
                  value={form.punchIn}
                  onChange={(e) => updateField("punchIn", e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>Punch Out</label>
                <input
                  type="datetime-local"
                  value={form.punchOut}
                  onChange={(e) => updateField("punchOut", e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.fullWidth}>
              <div className={styles.filterGroup}>
                <label>Attendance Status</label>
                <select
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className={styles.input}
                >
                  <option value="PRESENT">Present</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="WFH">WFH</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LEAVE">Leave</option>
                </select>
              </div>
            </div>

            <div className={styles.breakSection}>
              <h4>Breaks</h4>

              {form.breaks.map((b, index) => (
                <div key={index} className={styles.breakRow}>
                  <div className={styles.filterGroup}>
                    <label>Break In</label>
                    <input
                      type="datetime-local"
                      value={b.in}
                      onChange={(e) => updateBreak(index, "in", e.target.value)}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label>Break Out</label>
                    <input
                      type="datetime-local"
                      value={b.out}
                      onChange={(e) => updateBreak(index, "out", e.target.value)}
                      className={styles.input}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeBreak(index)}
                    className={styles.removeBtn}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button onClick={addBreak} className={styles.addBtn}>
                + Add Break
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={styles.saveBtn}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default HROverride;
