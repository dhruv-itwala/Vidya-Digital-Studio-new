// VIDYACRM/src/pages/Finance/FinanceDashboardPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getFinanceOverviewAPI } from "../../api/finance.api";
import Loader from "../../components/Loader/Loader";
import styles from "./FinanceDashboardPage.module.css";
import toast from "react-hot-toast";
import {
  FiDollarSign,
  FiTrendingUp,
  FiClock,
  FiShield,
  FiCreditCard,
  FiArrowRight,
  FiAlertTriangle,
  FiCalendar,
  FiLayers,
  FiRefreshCw,
} from "react-icons/fi";

export default function FinanceDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const location = useLocation();
  const basePath = location.pathname.startsWith("/hr") ? "/hr" : "/admin";

  const loadData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      const res = await getFinanceOverviewAPI();
      if (res.data?.success) {
        setData(res.data.data);
        if (showToast) toast.success("Finance metrics updated");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to load finance data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <Loader />;

  const metrics = data?.metrics || {};
  const currentCash = metrics.currentCash || 0;
  const totalReceivables = metrics.totalReceivables || 0;
  const totalPayables = metrics.totalPayables || 0;
  const freeCash = metrics.freeCash || 0;
  const reservedCash = metrics.reservedCash || 0;
  const projectedCash = metrics.projectedCash || 0;

  // Separation Bar percentage
  const reservedPct = currentCash > 0 ? Math.min(100, Math.round((reservedCash / currentCash) * 100)) : 0;
  const freePct = Math.max(0, 100 - reservedPct);

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* ================= HEADER AREA ================= */}
        <div className={styles.headerArea}>
          <div className={styles.titleBlock}>
            <h1 className={styles.pageTitle}>Cash Flow &amp; Financial Operations</h1>
            <div className={styles.statusPill}>
              <span className={styles.pulseDot}></span>
              <span>Operate Mode</span>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => loadData(true)}
              disabled={refreshing}
            >
              <FiRefreshCw size={14} className={refreshing ? "spin" : ""} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
            <Link to={`${basePath}/expenses`} className={styles.actionBtn}>
              <FiCreditCard size={14} />
              <span>Manage Expenses</span>
            </Link>
            <Link to={`${basePath}/cash-accounts`} className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
              <FiDollarSign size={14} />
              <span>Bank &amp; Cash Accounts</span>
            </Link>
          </div>
        </div>

        {/* ================= 4 CORE INVARIANT KPIS ================= */}
        <div className={styles.kpiGrid}>
          {/* 1. Liquid Bank Cash */}
          <div className={`${styles.kpiCard} ${styles.kpiCardCurrent}`}>
            <div className={styles.kpiCardTop}>
              <span className={styles.kpiLabel}>Current Liquid Cash</span>
              <div className={styles.kpiIconWrap} style={{ background: "#ecfdf5", color: "#0f5c44" }}>
                <FiDollarSign size={18} />
              </div>
            </div>
            <div className={styles.kpiValue}>₹{currentCash.toLocaleString("en-IN")}</div>
            <div className={styles.kpiSub}>
              <span>{data?.accounts?.[0]?.name || "Union Bank of India"} · A/C: {data?.accounts?.[0]?.accountNumber || "534202010030024"}</span>
            </div>
          </div>

          {/* 2. Expected Receivables */}
          <div className={`${styles.kpiCard} ${styles.kpiCardReceivables}`}>
            <div className={styles.kpiCardTop}>
              <span className={styles.kpiLabel}>Expected Receivables</span>
              <div className={styles.kpiIconWrap} style={{ background: "#eff6ff", color: "#2563eb" }}>
                <FiTrendingUp size={18} />
              </div>
            </div>
            <div className={styles.kpiValue}>₹{totalReceivables.toLocaleString("en-IN")}</div>
            <div className={styles.kpiSub}>
              <span style={{ color: metrics.overdueReceivables > 0 ? "#dc2626" : "#64748b" }}>
                ₹{(metrics.overdueReceivables || 0).toLocaleString("en-IN")} overdue
              </span>
            </div>
          </div>

          {/* 3. Total Payables */}
          <div className={`${styles.kpiCard} ${styles.kpiCardPayables}`}>
            <div className={styles.kpiCardTop}>
              <span className={styles.kpiLabel}>Total Payables</span>
              <div className={styles.kpiIconWrap} style={{ background: "#fffbeb", color: "#d97706" }}>
                <FiClock size={18} />
              </div>
            </div>
            <div className={styles.kpiValue}>₹{totalPayables.toLocaleString("en-IN")}</div>
            <div className={styles.kpiSub}>
              <span>
                Payroll{data?.payrollCutoffLabel ? ` (${data.payrollCutoffLabel})` : ""}: ₹{(metrics.payrollPending || 0).toLocaleString("en-IN")} · Bills: ₹{(metrics.expensePending || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* 4. Free Spendable Cash
          <div className={`${styles.kpiCard} ${styles.kpiCardFree}`}>
            <div className={styles.kpiCardTop}>
              <span className={styles.kpiLabel}>Unallocated Free Cash</span>
              <div className={styles.kpiIconWrap} style={{ background: "#dcfce7", color: "#15803d" }}>
                <FiShield size={18} />
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: freeCash > 0 ? "#0f5c44" : "#dc2626" }}>
              ₹{freeCash.toLocaleString("en-IN")}
            </div>
            <div className={styles.kpiSub}>
              <span>Safe to spend after meeting obligations</span>
            </div>
          </div> */}
        </div>

        {/* ================= VISUAL CASH SEPARATION BAR ================= */}
        {/* <div className={styles.separationBarCard}>
          <div className={styles.separationHeader}>
            <div>
              <div className={styles.separationTitle}>Cash Separation Engine</div>
              <div className={styles.separationSubtitle}>
                Invariant: Expected ≠ Received ≠ Reserved ≠ Paid ≠ Free Cash
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: "0.85rem", fontWeight: 700 }}>
              Projected Post-Obligations:{" "}
              <span style={{ color: projectedCash >= 0 ? "#0f5c44" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>
                ₹{projectedCash.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className={styles.barTrack}>
            <div
              className={styles.barSegmentReserved}
              style={{ width: `${reservedPct}%` }}
              title={`Reserved Cash: ₹${reservedCash.toLocaleString("en-IN")} (${reservedPct}%)`}
            ></div>
            <div
              className={styles.barSegmentFree}
              style={{ width: `${freePct}%` }}
              title={`Free Cash: ₹${freeCash.toLocaleString("en-IN")} (${freePct}%)`}
            ></div>
          </div>

          <div className={styles.barLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#f59e0b" }}></span>
              <span>Reserved Cash: ₹{reservedCash.toLocaleString("en-IN")} ({reservedPct}%)</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#10b981" }}></span>
              <span>Unallocated Free Cash: ₹{freeCash.toLocaleString("en-IN")} ({freePct}%)</span>
            </div>
            <div className={styles.legendItem} style={{ marginLeft: "auto", color: "#64748b" }}>
              Pending Payroll: {data?.pendingPayrollsCount || 0} batches
            </div>
          </div>
        </div> */}

        {/* ================= 2-COLUMN MAIN CONTENT ================= */}
        <div className={styles.dashboardGrid}>
          {/* Left Column: Bank Accounts & Overdue Invoices */}
          <div>
            {/* Studio Bank Account */}
            <div className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <FiDollarSign />
                  <span>Studio Bank Account</span>
                </div>
                <Link to={`${basePath}/cash-accounts`} className={styles.cardBadge}>
                  View Ledger &rarr;
                </Link>
              </div>

              <div className={styles.accountsList}>
                {data?.accounts?.[0] ? (
                  <div className={styles.accountItem} style={{ borderLeft: "3px solid #0f5c44" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className={styles.accountName} style={{ fontWeight: 800 }}>
                        {data.accounts[0].name}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "#ecfdf5",
                          color: "#0f5c44",
                        }}
                      >
                        OFFICIAL ACCOUNT
                      </span>
                    </div>
                    {data.accounts[0].accountNumber && (
                      <span className={styles.accountNum}>
                        A/C: {data.accounts[0].accountNumber} · IFSC: {data.accounts[0].ifscCode || "UBIN0553425"}
                      </span>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Liquid Balance</span>
                      <span className={styles.accountBal} style={{ margin: 0 }}>
                        ₹{(data.accounts[0].currentBalance || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "16px", color: "#64748b", fontSize: "0.85rem" }}>
                    Loading studio bank account...
                  </div>
                )}
              </div>
            </div>

            {/* Overdue Invoices Requiring Collection */}
            <div className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <FiAlertTriangle color="#dc2626" />
                  <span>Overdue Client Invoices</span>
                </div>
                <Link to={`${basePath}/invoices`} className={styles.cardBadge}>
                  Invoices &rarr;
                </Link>
              </div>

              {(data?.overdueInvoices || []).length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                  All client invoices are currently up to date!
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Client / Company</th>
                        <th>Pending Due</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.overdueInvoices.map((inv) => (
                        <tr key={inv._id}>
                          <td style={{ fontWeight: 700, color: "#0f5c44" }}>{inv.invoiceNumber}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{inv.companyName || inv.clientName}</div>
                            {inv.phone && <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{inv.phone}</div>}
                          </td>
                          <td style={{ fontWeight: 800, color: "#dc2626" }}>
                            ₹{inv.remainingAmount.toLocaleString("en-IN")}
                          </td>
                          <td style={{ color: "#b91c1c", fontWeight: 600 }}>{inv.dueDate || "Past Due"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Cash Ledger Transactions */}
            <div className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <FiLayers />
                  <span>Recent Cash Ledger Transactions</span>
                </div>
              </div>

              {(data?.recentTransactions || []).length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                  No transactions recorded yet.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Account</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentTransactions.map((tx) => (
                        <tr key={tx._id}>
                          <td style={{ color: "#64748b", fontSize: "0.75rem" }}>
                            {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background:
                                  tx.type === "INCOME"
                                    ? "#ecfdf5"
                                    : tx.type === "EXPENSE"
                                    ? "#fef2f2"
                                    : "#f1f5f9",
                                color:
                                  tx.type === "INCOME"
                                    ? "#065f46"
                                    : tx.type === "EXPENSE"
                                    ? "#991b1b"
                                    : "#475569",
                              }}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td style={{ fontWeight: 500 }}>{tx.description}</td>
                          <td style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            {tx.cashAccountId?.name || "Bank"}
                          </td>
                          <td
                            style={{
                              fontWeight: 800,
                              color: tx.type === "INCOME" ? "#065f46" : "#0f172a",
                            }}
                          >
                            {tx.type === "INCOME" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Upcoming Renewals & Department Payroll Cost */}
          <div>
            {/* Upcoming Subscription Renewals (Next 14 Days) */}
            <div className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <FiCalendar />
                  <span>Upcoming Renewals</span>
                </div>
                <Link to={`${basePath}/expenses`} className={styles.cardBadge}>
                  + Add Bill
                </Link>
              </div>

              {(data?.upcomingRenewals || []).length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                  No subscriptions or bills due in the next 14 days.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {data.upcomingRenewals.map((r) => (
                    <div
                      key={r._id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        background: r.daysRemaining <= 3 ? "#fffbeb" : "#f8fafc",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>{r.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {r.vendor || r.category} · {r.daysRemaining <= 0 ? "Due Today" : `In ${r.daysRemaining} days`}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f5c44" }}>
                        ₹{r.outstandingAmount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Department Payroll Distribution */}
            <div className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <FiLayers />
                  <span>Monthly Payroll by Department</span>
                </div>
                <span className={styles.cardBadge}>{data?.activeStaffCount || 0} Staff</span>
              </div>

              <div style={{ marginBottom: "14px", fontSize: "0.8rem", color: "#64748b" }}>
                Total Monthly Active Base Commitment:{" "}
                <strong style={{ color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                  ₹{(data?.totalActiveStaffSalary || 0).toLocaleString("en-IN")}
                </strong>
              </div>

              {Object.entries(data?.departmentCost || {}).map(([dept, cost]) => (
                <div key={dept} className={styles.deptRow}>
                  <span className={styles.deptName}>{dept}</span>
                  <span className={styles.deptVal}>₹{cost.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

