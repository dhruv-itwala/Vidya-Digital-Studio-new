import { useEffect, useState } from "react";
import {
  applyLeaveAPI,
  getMyLeavesAPI,
  cancelLeaveAPI,
} from "../../api/leave.api";
import styles from "./EmployeeLeaves.module.css";
import toast from "react-hot-toast";
import { formatToIST } from "../../utils/date.util";
import { FiCalendar, FiFileText, FiSend, FiXCircle } from "react-icons/fi";

export default function EmployeeLeaves() {
  const [fromDate, setFromDate] = useState("");
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

  useEffect(() => {
    fetchLeaves();
  }, []);

  const applyLeave = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select a date range.");
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
    if (!window.confirm("Are you sure you want to cancel this leave?")) return;
    await cancelLeaveAPI(id);
    toast.success("Leave cancelled");
    fetchLeaves();
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Leave Management</h2>
        <p className={styles.subtitle}>Apply for leaves and track your history.</p>
      </div>

      <div className={styles.contentGrid}>
        
        {/* APPLY LEAVE FORM */}
        <div className={styles.applyCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <FiCalendar />
            </div>
            <h3>Apply for Leave</h3>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.dateRow}>
              <div className={styles.inputWrap}>
                <label>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  min={todayStr}
                  onChange={(e) => setFromDate(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.inputWrap}>
                <label>To Date</label>
                <input
                  type="date"
                  min={fromDate || todayStr}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.optionsRow}>
              <div className={styles.inputWrap}>
                <label>Leave Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className={styles.select}>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className={styles.toggleWrap}>
                <label className={styles.toggleLabel}>Half Day</label>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={isHalfDay}
                    onChange={(e) => setIsHalfDay(e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            <div className={styles.inputWrap}>
              <label>Reason (Optional)</label>
              <textarea
                placeholder="Briefly explain your reason for leave..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={styles.textarea}
              />
            </div>

            <button
              className={styles.submitBtn}
              onClick={applyLeave}
              disabled={loading}
            >
              <FiSend /> {loading ? "Applying..." : "Submit Application"}
            </button>
          </div>
        </div>

        {/* LEAVE HISTORY */}
        <div className={styles.historyCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperOrange}>
              <FiFileText />
            </div>
            <h3>Leave History</h3>
          </div>
          
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Half Day</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className={styles.emptyState}>
                        <p>No leave records found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l._id}>
                      <td>
                        <span className={styles.duration}>
                          {formatToIST(l.fromDate)} <span className={styles.arrow}>→</span> {formatToIST(l.toDate)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.typeBadge}>{l.type}</span>
                      </td>
                      <td>
                        <span className={l.isHalfDay ? styles.yesBadge : styles.noBadge}>
                          {l.isHalfDay ? "YES" : "NO"}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[l.status.toLowerCase()]}`}>
                          {l.status}
                        </span>
                      </td>
                      <td>
                        {((l.status === "PENDING" || l.status === "APPROVED") && new Date(l.toDate) >= new Date(new Date().setHours(0,0,0,0))) && (
                          <button
                            className={styles.cancelBtn}
                            onClick={() => cancelLeave(l._id)}
                            title="Cancel Leave"
                          >
                            <FiXCircle /> Cancel
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
