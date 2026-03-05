import { useEffect, useState } from "react";
import {
  applyLeaveAPI,
  getMyLeavesAPI,
  cancelLeaveAPI,
} from "../../api/leave.api";
import styles from "./EmployeeLeaves.module.css";
import toast from "react-hot-toast";
import { getMyLeaveBalanceAPI } from "../../api/leaveBalance.api";
import { formatToIST } from "../../utils/date.util";

export default function EmployeeLeaves() {
  const [fromDate, setFromDate] = useState("");
  const [availableLeaves, setAvailableLeaves] = useState(null);
  const [toDate, setToDate] = useState("");
  const [type, setType] = useState("CASUAL");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const fetchLeaves = async () => {
    const res = await getMyLeavesAPI();
    setLeaves(res.data || []);
  };

  const fetchLeaveBalance = async () => {
    try {
      const res = await getMyLeaveBalanceAPI();
      setAvailableLeaves(res.data.availableLeaves);
    } catch {
      toast.error("Failed to load leave balance");
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchLeaveBalance();
  }, []);

  const applyLeave = async () => {
    if (!fromDate || !toDate) {
      toast.alert("Select date range");
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
      toast.success("Leave applied successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply leave");
    } finally {
      setLoading(false);
    }
  };

  const cancelLeave = async (id) => {
    if (!window.confirm("Cancel this leave?")) return;
    await cancelLeaveAPI(id);
    fetchLeaves();
    fetchLeaveBalance();
  };

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <h2 className={styles.title}>My Leaves</h2>
        {/* LEAVE BALANCE */}
        {/* <div className={styles.card} style={{ textAlign: "center" }}>
          <h3>Available Leaves</h3>
          <p className={styles.leaveBalance}>
            {availableLeaves !== null ? availableLeaves : "—"}
          </p>
          <small>2 leaves credited every month</small>
        </div> */}

        {/* APPLY LEAVE FORM */}
        <div className={styles.card}>
          <div className={styles.formRow}>
            <input
              type="date"
              value={fromDate}
              min={todayStr}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <input
              type="date"
              min={fromDate}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="CASUAL">Casual</option>
              <option value="SICK">Sick</option>
              <option value="UNPAID">Unpaid</option>
            </select>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
              />
              <span className={styles.slider}></span>
              <span className={styles.labelText}>Half Day</span>
            </label>
          </div>

          <div className={styles.formRow}>
            <textarea
              placeholder="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button
            className={styles.primaryBtn}
            onClick={applyLeave}
            disabled={loading}
          >
            {loading ? "Applying..." : "Apply Leave"}
          </button>
        </div>

        {/* LEAVE HISTORY */}
        <div className={styles.card}>
          <h3>Leave History</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.leaveTable}>
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
                    <td colSpan="5" className={styles.empty}>
                      No leave records
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l._id}>
                      <td>
                        {formatToIST(l.fromDate)} → {formatToIST(l.toDate)}
                      </td>
                      <td>{l.type}</td>
                      <td>{l.isHalfDay ? "Yes" : "No"}</td>
                      <td className={styles[`status${l.status}`]}>
                        {l.status}
                      </td>
                      <td>
                        {(l.status === "PENDING" ||
                          l.status === "APPROVED") && (
                          <button
                            className={styles.cancelBtn}
                            onClick={() => cancelLeave(l._id)}
                          >
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
    </div>
  );
}
