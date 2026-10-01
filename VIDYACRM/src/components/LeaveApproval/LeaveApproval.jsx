import { useEffect, useMemo, useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  getAllLeavesAPI,
  approveLeaveAPI,
  declineLeaveAPI,
  cancelLeaveAPI,
  getAllUsersLeaveAnalyticsAPI,
} from "../../api/leave.api";

import styles from "./LeaveApproval.module.css";
import Loader from "../../components/Loader/Loader";
import LeaveCalendar from "../../components/LeaveCalendar/LeaveCalendar";
import { FiChevronDown, FiChevronUp, FiCheckCircle, FiXCircle, FiClock, FiFileText } from "react-icons/fi";

const PAGE_SIZE = 25;

export default function LeaveApproval() {
  const [leaves, setLeaves] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const isFetchingRef = useRef(false);

  /* ================= ACCORDION ================= */
  const [open, setOpen] = useState({
    pending: true,
    history: false,
    calendar: false,
    balances: false,
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
  const fetchLeaves = async (showInitialLoader = false) => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      if (showInitialLoader) setInitialLoading(true);
      const [leavesRes, analyticsRes] = await Promise.all([
        getAllLeavesAPI(),
        getAllUsersLeaveAnalyticsAPI(),
      ]);
      setLeaves(leavesRes.data || []);
      setAnalytics(analyticsRes.data || []);
    } catch(err) {
      console.error(err);
      toast.error(err?.message || "Failed to load leave records");
    } finally {
      isFetchingRef.current = false;
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves(true);
    const interval = setInterval(() => fetchLeaves(false), 15000);
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
    if (actionLoading[id]) return;
    const previous = [...leaves];
    updateOptimistic(id, "APPROVED");
    setActionLoading((prev) => ({ ...prev, [id]: "approving" }));
    try {
      await approveLeaveAPI(id);
      toast.success("Leave approved");
      fetchLeaves(false);
    } catch (err) {
      setLeaves(previous);
      toast.error(err?.message || "Failed to approve leave");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const decline = async (id) => {
    if (actionLoading[id]) return;
    const previous = [...leaves];
    updateOptimistic(id, "DECLINED");
    setActionLoading((prev) => ({ ...prev, [id]: "declining" }));
    try {
      await declineLeaveAPI(id);
      toast.success("Leave declined");
      fetchLeaves(false);
    } catch (err) {
      setLeaves(previous);
      toast.error(err?.message || "Failed to decline leave");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const cancel = async (id) => {
    if (actionLoading[id]) return;
    if (!window.confirm("Cancel this leave?")) return;
    const previous = [...leaves];
    updateOptimistic(id, "CANCELLED");
    setActionLoading((prev) => ({ ...prev, [id]: "cancelling" }));
    try {
      await cancelLeaveAPI(id);
      toast.success("Leave cancelled");
      fetchLeaves(false);
    } catch (err) {
      setLeaves(previous);
      toast.error(err?.message || "Failed to cancel leave");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (initialLoading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Leave Approvals</h2>
          <p className={styles.subtitle}>Manage and review employee leave requests.</p>
        </div>
        <Loader />
      </div>
    );
  }

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
                          <td data-label="Employee">
                            <div className={styles.employeeInfo}>
                              <span className={styles.empName}>{l.user?.name}</span>
                            </div>
                          </td>
                          <td data-label="Duration">
                            <span className={styles.duration}>
                              {formatDateIST(l.fromDate)} <span className={styles.arrow}>→</span> {formatDateIST(l.toDate)}
                            </span>
                          </td>
                          <td data-label="Type & Half Day">
                            <div className={styles.typeGroup}>
                              <span className={`${styles.typeBadge} ${styles[l.type?.toLowerCase()] || ""}`}>{l.type}</span>
                              {l.isHalfDay && <span className={styles.halfDayBadge}>Half Day</span>}
                            </div>
                          </td>
                          <td data-label="Reason"><span className={styles.reasonText}>{l.reason || "—"}</span></td>
                          <td data-label="Actions">
                            <div className={styles.actionGroup}>
                              <button
                                className={styles.approveBtn}
                                onClick={() => approve(l._id)}
                                disabled={Boolean(actionLoading[l._id])}
                                title="Approve"
                              >
                                {actionLoading[l._id] === "approving" ? "Approving..." : <><FiCheckCircle /> Approve</>}
                              </button>
                              <button
                                className={styles.declineBtn}
                                onClick={() => decline(l._id)}
                                disabled={Boolean(actionLoading[l._id])}
                                title="Decline"
                              >
                                {actionLoading[l._id] === "declining" ? "Declining..." : <><FiXCircle /> Decline</>}
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
                          <td data-label="Employee">
                            <div className={styles.employeeInfo}>
                              <span className={styles.empName}>{l.user?.name}</span>
                            </div>
                          </td>
                          <td data-label="Duration">
                            <span className={styles.duration}>
                              {formatDateIST(l.fromDate)} <span className={styles.arrow}>→</span> {formatDateIST(l.toDate)}
                            </span>
                          </td>
                          <td data-label="Type & Half Day">
                            <div className={styles.typeGroup}>
                              <span className={`${styles.typeBadge} ${styles[l.type?.toLowerCase()] || ""}`}>{l.type}</span>
                              {l.isHalfDay && <span className={styles.halfDayBadge}>Half Day</span>}
                            </div>
                          </td>
                          <td data-label="Status">
                            <div className={styles.statusGroup}>
                              <span className={`${styles.statusBadge} ${styles[l.status.toLowerCase()]}`}>
                                {l.status}
                              </span>
                              {l.status === "APPROVED" && new Date(l.toDate) >= today && (
                                <button
                                  className={styles.cancelLink}
                                  disabled={Boolean(actionLoading[l._id])}
                                  onClick={() => cancel(l._id)}
                                >
                                  {actionLoading[l._id] === "cancelling" ? "Revoking..." : "Revoke"}
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

        {/* ================= BALANCES ================= */}
        <div className={styles.accordion}>
          <div className={styles.accordionHeader} onClick={() => toggle("balances")}>
            <div className={styles.headerLeft}>
              <div className={styles.iconWrapperOrange}>
                <FiFileText />
              </div>
              <h3>Employee Leave Balances</h3>
            </div>
            <div className={styles.headerRight}>
              {open.balances ? <FiChevronUp /> : <FiChevronDown />}
            </div>
          </div>

          {open.balances && (
            <div className={styles.accordionBody}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Total Accrued</th>
                      <th>Total Taken</th>
                      <th>Pending Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.length === 0 ? (
                      <tr>
                        <td colSpan="4">
                          <div className={styles.emptyState}>No balance data found.</div>
                        </td>
                      </tr>
                    ) : (
                      analytics.map((a) => (
                        <tr key={a.user._id}>
                          <td data-label="Employee">
                            <div className={styles.employeeInfo}>
                              <span className={styles.empName}>{a.user.name}</span>
                              <span className={styles.empEmail} style={{ display: "block", fontSize: "0.8rem", color: "gray" }}>{a.user.email}</span>
                            </div>
                          </td>
                          <td data-label="Total Accrued">
                            <span className={styles.duration}>
                              {a.summary.totalAllowed} (inc. {a.summary.carryForward || 0} CF)
                            </span>
                          </td>
                          <td data-label="Total Taken">
                            <span className={styles.duration}>
                              {a.summary.used} (S: {a.taken.sick || 0} / C: {a.taken.casual || 0} / E: {a.taken.earned || 0}{a.taken.unpaid ? ` / U: ${a.taken.unpaid}` : ""})
                            </span>
                          </td>
                          <td data-label="Pending Balance">
                            <span className={styles.statusBadge} style={{ background: '#ecfdf5', color: '#059669', fontSize: '1rem', padding: '6px 12px' }}>
                              {a.summary.remaining}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
