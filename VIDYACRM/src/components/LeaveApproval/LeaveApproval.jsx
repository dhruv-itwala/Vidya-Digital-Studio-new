import { useEffect, useMemo, useState } from "react";
import {
  getAllLeavesAPI,
  approveLeaveAPI,
  declineLeaveAPI,
  cancelLeaveAPI,
} from "../../api/leave.api";

import styles from "./LeaveApproval.module.css";
import Loader from "../../components/Loader/Loader";
import LeaveCalendar from "../../components/LeaveCalendar/LeaveCalendar";
import { FiChevronDown, FiChevronUp, FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";

const PAGE_SIZE = 25;

export default function LeaveApproval() {
  const [leaves, setLeaves] = useState([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [loading, setLoading] = useState(false);

  /* ================= ACCORDION ================= */
  const [open, setOpen] = useState({
    pending: true, // open by default
    history: false,
    calendar: false,
  });

  const toggle = (key) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* =========== HELPER ============= */
  const formatDateIST = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

  /* ================= FETCH ================= */
  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await getAllLeavesAPI();
      setLeaves(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    const interval = setInterval(fetchLeaves, 10000);
    return () => clearInterval(interval);
  }, []);

  /* ================= DERIVED ================= */
  const pendingLeaves = useMemo(
    () => leaves.filter((l) => l.status === "PENDING"),
    [leaves],
  );

  const historyLeaves = useMemo(
    () =>
      leaves.filter((l) =>
        ["APPROVED", "DECLINED", "CANCELLED"].includes(l.status),
      ),
    [leaves],
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

  const cancel = async (id) => {
    if (!window.confirm("Cancel this leave?")) return;
    updateOptimistic(id, "CANCELLED");
    await cancelLeaveAPI(id);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Leave Approvals</h2>
        <p className={styles.subtitle}>Manage and review employee leave requests.</p>
      </div>

      <div className={styles.content}>
        {/* ================= PENDING ================= */}
        <div className={styles.accordion}>
          <div className={styles.accordionHeader} onClick={() => toggle("pending")}>
            <div className={styles.headerLeft}>
              <div className={styles.iconWrapperOrange}>
                <FiClock />
              </div>
              <h3>Pending Requests</h3>
              <span className={styles.badge}>{pendingLeaves.length}</span>
            </div>
            <div className={styles.headerRight}>
              {open.pending ? <FiChevronUp /> : <FiChevronDown />}
            </div>
          </div>

          {open.pending && (
            <div className={styles.accordionBody}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Duration</th>
                      <th>Type & Half Day</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginate(pendingLeaves, pendingPage).length === 0 ? (
                      <tr>
                        <td colSpan="5">
                          <div className={styles.emptyState}>No pending leave requests.</div>
                        </td>
                      </tr>
                    ) : (
                      paginate(pendingLeaves, pendingPage).map((l) => (
                        <tr key={l._id}>
                          <td>
                            <div className={styles.employeeInfo}>
                              <span className={styles.empName}>{l.user?.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className={styles.duration}>
                              {formatDateIST(l.fromDate)} <span className={styles.arrow}>→</span> {formatDateIST(l.toDate)}
                            </span>
                          </td>
                          <td>
                            <div className={styles.typeGroup}>
                              <span className={styles.typeBadge}>{l.type}</span>
                              {l.isHalfDay && <span className={styles.halfDayBadge}>Half Day</span>}
                            </div>
                          </td>
                          <td><span className={styles.reasonText}>{l.reason || "—"}</span></td>
                          <td>
                            <div className={styles.actionGroup}>
                              <button className={styles.approveBtn} onClick={() => approve(l._id)} title="Approve">
                                <FiCheckCircle /> Approve
                              </button>
                              <button className={styles.declineBtn} onClick={() => decline(l._id)} title="Decline">
                                <FiXCircle /> Decline
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {pendingLeaves.length > PAGE_SIZE && (
                <Pagination page={pendingPage} total={pendingLeaves.length} onChange={setPendingPage} />
              )}
            </div>
          )}
        </div>

        {/* ================= HISTORY ================= */}
        <div className={styles.accordion}>
          <div className={styles.accordionHeader} onClick={() => toggle("history")}>
            <div className={styles.headerLeft}>
              <div className={styles.iconWrapperGreen}>
                <FiCheckCircle />
              </div>
              <h3>Leave History</h3>
            </div>
            <div className={styles.headerRight}>
              {open.history ? <FiChevronUp /> : <FiChevronDown />}
            </div>
          </div>

          {open.history && (
            <div className={styles.accordionBody}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Duration</th>
                      <th>Type & Half Day</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginate(historyLeaves, historyPage).length === 0 ? (
                      <tr>
                        <td colSpan="4">
                          <div className={styles.emptyState}>No leave history found.</div>
                        </td>
                      </tr>
                    ) : (
                      paginate(historyLeaves, historyPage).map((l) => (
                        <tr key={l._id}>
                          <td>
                            <div className={styles.employeeInfo}>
                              <span className={styles.empName}>{l.user?.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className={styles.duration}>
                              {formatDateIST(l.fromDate)} <span className={styles.arrow}>→</span> {formatDateIST(l.toDate)}
                            </span>
                          </td>
                          <td>
                            <div className={styles.typeGroup}>
                              <span className={styles.typeBadge}>{l.type}</span>
                              {l.isHalfDay && <span className={styles.halfDayBadge}>Half Day</span>}
                            </div>
                          </td>
                          <td>
                            <div className={styles.statusGroup}>
                              <span className={`${styles.statusBadge} ${styles[l.status.toLowerCase()]}`}>
                                {l.status}
                              </span>
                              {l.status === "APPROVED" && new Date(l.toDate) >= today && (
                                <button className={styles.cancelLink} onClick={() => cancel(l._id)}>
                                  Revoke
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {historyLeaves.length > PAGE_SIZE && (
                <Pagination page={historyPage} total={historyLeaves.length} onChange={setHistoryPage} />
              )}
            </div>
          )}
        </div>

        {/* ================= CALENDAR ================= */}
        <div className={styles.accordion}>
          <div className={styles.accordionHeader} onClick={() => toggle("calendar")}>
            <div className={styles.headerLeft}>
              <div className={styles.iconWrapperNeutral}>
                <FiClock />
              </div>
              <h3>Leave Calendar</h3>
            </div>
            <div className={styles.headerRight}>
              {open.calendar ? <FiChevronUp /> : <FiChevronDown />}
            </div>
          </div>

          {open.calendar && (
            <div className={styles.accordionBody}>
              <LeaveCalendar />
            </div>
          )}
        </div>

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
          className={page === i + 1 ? styles.activePage : styles.pageBtn}
          onClick={() => onChange(i + 1)}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
