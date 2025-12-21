import { useEffect, useState } from "react";
import {
  applyLeaveAPI,
  getMyLeavesAPI,
  cancelLeaveAPI,
} from "../../api/leave.api";
import styles from "./EmployeeLeaves.module.css";

export default function EmployeeLeaves() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [type, setType] = useState("CASUAL");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaves = async () => {
    const res = await getMyLeavesAPI();
    setLeaves(res.data || []);
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const applyLeave = async () => {
    if (!fromDate || !toDate) {
      alert("Select date range");
      return;
    }

    try {
      setLoading(true);
      await applyLeaveAPI({
        fromDate,
        toDate,
        type,
        isHalfDay,
        reason,
      });

      setFromDate("");
      setToDate("");
      setIsHalfDay(false);
      setReason("");

      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to apply leave");
    } finally {
      setLoading(false);
    }
  };

  const cancelLeave = async (id) => {
    if (!window.confirm("Cancel this leave?")) return;
    await cancelLeaveAPI(id);
    fetchLeaves();
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toISOString().split("T")[0];
  };

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <h2>My Leaves</h2>

        {/* APPLY */}
        <div className={styles.card}>
          <h3>Apply Leave</h3>

          <div className={styles.formRow}>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <input
              type="date"
              min={fromDate}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className={styles.formRow}>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="CASUAL">Casual</option>
              <option value="SICK">Sick</option>
              <option value="UNPAID">Unpaid</option>
            </select>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
              />
              Half Day
            </label>
          </div>

          <textarea
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <button onClick={applyLeave} disabled={loading}>
            {loading ? "Applying..." : "Apply Leave"}
          </button>
        </div>

        {/* HISTORY */}
        <div className={styles.card}>
          <h3>Leave History</h3>

          <table>
            <thead>
              <tr>
                <th>Duration</th>
                <th>Type</th>
                <th>Half Day</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan="5">No leave records</td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l._id}>
                    <td>
                      {formatDate(l.fromDate)} → {formatDate(l.toDate)}
                    </td>

                    <td>{l.type}</td>
                    <td>{l.isHalfDay ? "Yes" : "No"}</td>
                    <td className={styles[`status${l.status}`]}>{l.status}</td>
                    <td>
                      {(l.status === "PENDING" || l.status === "APPROVED") && (
                        <button onClick={() => cancelLeave(l._id)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
