import { useEffect, useMemo, useState } from "react";
import {
  getAllLeavesAPI,
  approveLeaveAPI,
  declineLeaveAPI,
} from "../../api/leave.api";
import styles from "./AdminLeaveApproval.module.css";
import Loader from "../../components/Loader/Loader";
import LeaveCalendar from "../../components/LeaveCalendar/LeaveCalendar";

const PAGE_SIZE = 5;

export default function AdminLeaveApproval() {
  const [leaves, setLeaves] = useState([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */
  const fetchLeaves = async () => {
    setLoading(true);
    const res = await getAllLeavesAPI();
    setLeaves(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  /* ================= DERIVED ================= */
  const pendingLeaves = useMemo(
    () => leaves.filter((l) => l.status === "PENDING"),
    [leaves]
  );

  const historyLeaves = useMemo(
    () =>
      leaves.filter((l) =>
        ["APPROVED", "DECLINED", "CANCELLED"].includes(l.status)
      ),
    [leaves]
  );

  const paginate = (items, page) =>
    items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ================= ACTIONS ================= */
  const updateOptimistic = (id, status) => {
    setLeaves((prev) => prev.map((l) => (l._id === id ? { ...l, status } : l)));
  };

  const approve = async (id) => {
    updateOptimistic(id, "APPROVED");
    await approveLeaveAPI(id);
  };

  const decline = async (id) => {
    updateOptimistic(id, "DECLINED");
    await declineLeaveAPI(id);
  };

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* ================= PENDING ================= */}
        <h2 className={styles.title}>Pending Leave Requests</h2>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Duration</th>
              <th>Type</th>
              <th>Half Day</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginate(pendingLeaves, pendingPage).length === 0 && (
              <tr>
                <td colSpan="6">No pending leaves</td>
              </tr>
            )}

            {paginate(pendingLeaves, pendingPage).map((l) => (
              <tr key={l._id}>
                <td>{l.user?.name}</td>
                <td>
                  {l.fromDate.slice(0, 10)} → {l.toDate.slice(0, 10)}
                </td>
                <td>{l.type}</td>
                <td>{l.isHalfDay ? "Yes" : "No"}</td>
                <td>{l.reason}</td>
                <td>
                  <button
                    className={styles.approveBtn}
                    onClick={() => approve(l._id)}
                  >
                    Approve
                  </button>
                  <button
                    className={styles.declineBtn}
                    onClick={() => decline(l._id)}
                  >
                    Decline
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pendingLeaves.length > PAGE_SIZE && (
          <Pagination
            page={pendingPage}
            total={pendingLeaves.length}
            onChange={setPendingPage}
          />
        )}

        {/* ================= HISTORY ================= */}
        <h2 className={styles.title}>Leave History</h2>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Duration</th>
              <th>Type</th>
              <th>Half Day</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {paginate(historyLeaves, historyPage).length === 0 && (
              <tr>
                <td colSpan="5">No leave history</td>
              </tr>
            )}

            {paginate(historyLeaves, historyPage).map((l) => (
              <tr key={l._id}>
                <td>{l.user?.name}</td>
                <td>
                  {l.fromDate.slice(0, 10)} → {l.toDate.slice(0, 10)}
                </td>
                <td>{l.type}</td>
                <td>{l.isHalfDay ? "Yes" : "No"}</td>
                <td className={styles[`status${l.status}`]}>{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {historyLeaves.length > PAGE_SIZE && (
          <Pagination
            page={historyPage}
            total={historyLeaves.length}
            onChange={setHistoryPage}
          />
        )}

        {/* =================  Leave Calendar ================= */}
        <h2 className={styles.title}>Leave Calendar</h2>
        <LeaveCalendar />

        {loading && <Loader />}
      </div>
    </div>
  );
}

/* ================= PAGINATION ================= */
function Pagination({ page, total, onChange }) {
  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={styles.pagination}>
      {Array.from({ length: pages }, (_, i) => (
        <button
          key={i}
          className={page === i + 1 ? styles.activePage : ""}
          onClick={() => onChange(i + 1)}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
