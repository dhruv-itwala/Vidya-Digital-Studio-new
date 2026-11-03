// VIDYACRM/src/pages/Finance/ExpensesPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getExpensesAPI, deleteExpenseAPI } from "../../api/finance.api";
import ExpenseModal from "./ExpenseModal";
import ExpensePayoutModal from "./ExpensePayoutModal";
import Loader from "../../components/Loader/Loader";
import styles from "./ExpensesPage.module.css";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiDollarSign,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutExpense, setPayoutExpense] = useState(null);

  const location = useLocation();
  const basePath = location.pathname.startsWith("/hr") ? "/hr" : "/admin";

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await getExpensesAPI({
        search,
        category: categoryFilter,
        status: statusFilter,
        department: departmentFilter,
      });

      if (res.data?.success) {
        setExpenses(res.data.data || []);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, statusFilter, departmentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExpenses();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete expense "${name}"?`)) return;

    try {
      await deleteExpenseAPI(id);
      toast.success("Expense deleted successfully");
      fetchExpenses();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete expense");
    }
  };

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* ================= HEADER AREA ================= */}
        <div className={styles.headerArea}>
          <div className={styles.titleBlock}>
            <Link to={`${basePath}/finance`} className={styles.badge} style={{ textDecoration: "none" }}>
              <FiArrowLeft /> Finance
            </Link>
            <h1 className={styles.pageTitle}>Expenses &amp; Subscriptions</h1>
            <span className={styles.badge}>{expenses.length} Records</span>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
            >
              <FiPlus size={16} />
              <span>Add Expense / Bill</span>
            </button>
          </div>
        </div>

        {/* ================= STATS CARDS ================= */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Obligations</div>
            <div className={styles.statVal}>
              ₹{(summary.totalObligations || 0).toLocaleString("en-IN")}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Paid Out</div>
            <div className={styles.statVal} style={{ color: "#0f5c44" }}>
              ₹{(summary.totalPaid || 0).toLocaleString("en-IN")}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Pending / Upcoming</div>
            <div className={styles.statVal} style={{ color: "#d97706" }}>
              ₹{(summary.totalPending || 0).toLocaleString("en-IN")}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Overdue Bills</div>
            <div className={styles.statVal} style={{ color: "#dc2626" }}>
              ₹{(summary.totalOverdue || 0).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* ================= FILTER BAR ================= */}
        <div className={styles.filterCard}>
          <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
            <FiSearch color="#64748b" />
            <input
              type="text"
              placeholder="Search expenses, vendors, notes..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <select
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Subscription">Subscriptions</option>
            <option value="Bill">Utility Bills</option>
            <option value="Vendor">Vendor Payouts</option>
            <option value="Recurring">Recurring</option>
            <option value="One-Time">One-Time</option>
            <option value="Other">Other</option>
          </select>

          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Partially Paid">Partially Paid</option>
          </select>

          <select
            className={styles.filterSelect}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            <option value="sales">Sales</option>
            <option value="designing">Designing</option>
            <option value="development">Development</option>
            <option value="editing">Editing</option>
            <option value="management">Management</option>
            <option value="administrative">Administrative</option>
          </select>
        </div>

        {/* ================= TABLE ================= */}
        <div className={styles.tableCard}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <Loader />
            </div>
          ) : expenses.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
              No expenses found matching the selected filters.
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title &amp; Vendor</th>
                    <th>Category</th>
                    <th>Frequency</th>
                    <th>Due Date</th>
                    <th>Amount (₹)</th>
                    <th>Remaining Due</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => {
                    const statusClass =
                      exp.status === "Paid"
                        ? styles.status_paid
                        : exp.status === "Overdue"
                        ? styles.status_overdue
                        : exp.status === "Partially Paid"
                        ? styles.status_partially_paid
                        : styles.status_pending;

                    return (
                      <tr key={exp._id}>
                        <td>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{exp.name}</div>
                          {exp.vendor && (
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{exp.vendor}</div>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              background: "#f1f5f9",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            {exp.category}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "#475569" }}>{exp.frequency}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {new Date(exp.dueDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          {exp.daysOverdue > 0 && (
                            <div style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 700 }}>
                              {exp.daysOverdue} days overdue
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 800 }}>₹{exp.amount?.toLocaleString("en-IN")}</td>
                        <td
                          style={{
                            fontWeight: 800,
                            color: exp.outstandingAmount > 0 ? "#b91c1c" : "#0f5c44",
                          }}
                        >
                          ₹{(exp.outstandingAmount ?? exp.amount)?.toLocaleString("en-IN")}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "#e2e8f0",
                              color: "#334155",
                            }}
                          >
                            {exp.department || "ALL"}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${statusClass}`}>
                            {exp.status}
                          </span>
                        </td>
                        <td>
                          <div className={styles.rowActions}>
                            {exp.outstandingAmount > 0 && exp.status !== "Paid" && (
                              <button
                                type="button"
                                className={styles.payBtn}
                                onClick={() => {
                                  setPayoutExpense(exp);
                                  setPayoutModalOpen(true);
                                }}
                              >
                                Pay
                              </button>
                            )}
                            <button
                              type="button"
                              className={styles.iconActionBtn}
                              title="Edit Expense"
                              onClick={() => {
                                setEditingExpense(exp);
                                setExpenseModalOpen(true);
                              }}
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.iconActionBtn} ${styles.deleteBtn}`}
                              title="Delete Expense"
                              onClick={() => handleDelete(exp._id, exp.name)}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Expense Create/Edit Modal */}
        <ExpenseModal
          isOpen={expenseModalOpen}
          expense={editingExpense}
          onClose={() => setExpenseModalOpen(false)}
          onSaved={fetchExpenses}
        />

        {/* Expense Payout Modal */}
        <ExpensePayoutModal
          isOpen={payoutModalOpen}
          expense={payoutExpense}
          onClose={() => setPayoutModalOpen(false)}
          onPaid={fetchExpenses}
        />
      </div>
    </div>
  );
}

