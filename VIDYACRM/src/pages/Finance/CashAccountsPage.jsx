// VIDYACRM/src/pages/Finance/CashAccountsPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCashAccountsAPI, getCashTransactionsAPI } from "../../api/finance.api";
import AccountModal from "./AccountModal";
import Loader from "../../components/Loader/Loader";
import styles from "./ExpensesPage.module.css";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiSliders,
  FiEdit2,
  FiDollarSign,
  FiLayers,
  FiCheckCircle,
  FiShield,
  FiCreditCard,
} from "react-icons/fi";

export default function CashAccountsPage() {
  const [account, setAccount] = useState(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("adjust"); // "adjust" | "edit"

  const location = useLocation();
  const basePath = location.pathname.startsWith("/hr") ? "/hr" : "/admin";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, txRes] = await Promise.all([
        getCashAccountsAPI(),
        getCashTransactionsAPI({ limit: 50 }),
      ]);

      if (accRes.data?.success) {
        const list = accRes.data.data || [];
        const primary = list[0] || null;
        setAccount(primary);
        setTotalBalance(primary ? Number(primary.currentBalance) || 0 : accRes.data.totalBalance || 0);
      }

      if (txRes.data?.success) {
        setTransactions(txRes.data.data || []);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to load bank ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* ================= HEADER AREA ================= */}
        <div className={styles.headerArea}>
          <div className={styles.titleBlock}>
            <Link to={`${basePath}/finance`} className={styles.badge} style={{ textDecoration: "none" }}>
              <FiArrowLeft /> Finance
            </Link>
            <h1 className={styles.pageTitle}>Bank &amp; Cash Accounts Ledger</h1>
            <span className={styles.badge} style={{ background: "#ecfdf5", color: "#0f5c44", fontWeight: 800 }}>
              Liquid Balance: ₹{totalBalance.toLocaleString("en-IN")}
            </span>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              style={{ background: "#f1f5f9", color: "#1e293b", border: "1px solid #cbd5e1" }}
              onClick={() => {
                setModalMode("adjust");
                setModalOpen(true);
              }}
            >
              <FiSliders size={15} />
              <span>Reconcile Balance</span>
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => {
                setModalMode("edit");
                setModalOpen(true);
              }}
            >
              <FiEdit2 size={15} />
              <span>Edit Bank Details</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <Loader />
          </div>
        ) : (
          <>
            {/* ================= SINGLE PRIMARY BANK ACCOUNT CARD ================= */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "24px 28px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                marginBottom: "32px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: "linear-gradient(90deg, #0f5c44, #10b981)",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "16px",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "18px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#ecfdf5",
                      color: "#0f5c44",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.4rem",
                    }}
                  >
                    <FiCreditCard />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                        {account?.name || "Union Bank of India"}
                      </h2>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "#e0f2fe",
                          color: "#0369a1",
                          letterSpacing: "0.04em",
                        }}
                      >
                        OFFICIAL STUDIO ACCOUNT
                      </span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "3px" }}>
                      Primary settlement account for client invoice collections &amp; operations
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className={styles.payBtn}
                    style={{ background: "#f8fafc", color: "#1e293b", border: "1px solid #cbd5e1" }}
                    onClick={() => {
                      setModalMode("adjust");
                      setModalOpen(true);
                    }}
                  >
                    <FiSliders size={13} style={{ marginRight: "4px" }} />
                    Reconcile
                  </button>
                  <button
                    type="button"
                    className={styles.payBtn}
                    style={{ background: "#ecfdf5", color: "#0f5c44", border: "1px solid #a7f3d0" }}
                    onClick={() => {
                      setModalMode("edit");
                      setModalOpen(true);
                    }}
                  >
                    <FiEdit2 size={13} style={{ marginRight: "4px" }} />
                    Edit Details
                  </button>
                </div>
              </div>

              {/* Grid of Bank Details & Balance */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "20px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    CURRENT LIQUID BALANCE
                  </div>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: 800,
                      color: "#0f5c44",
                      margin: "4px 0",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ₹{(account?.currentBalance || 0).toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    Opening: ₹{(account?.openingBalance || 0).toLocaleString("en-IN")}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    ACCOUNT NUMBER
                  </div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      color: "#1e293b",
                      marginTop: "6px",
                      fontFamily: "monospace",
                    }}
                  >
                    {account?.accountNumber || "534202010030024"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                    IFSC: <span style={{ fontWeight: 700, color: "#0f172a" }}>{account?.ifscCode || "UBIN0553425"}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    ACCOUNT HOLDER
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1e293b", marginTop: "6px" }}>
                    {account?.accountHolderName || "Dheemahi Arkeshbhai Joshi"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                    Vidya Digital Studio
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    UPI VPA ID
                  </div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      color: "#0f5c44",
                      marginTop: "6px",
                      fontFamily: "monospace",
                    }}
                  >
                    {account?.upiId || "dheemahi2@okhdfcbank"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                    Configured for invoice QR codes
                  </div>
                </div>
              </div>
            </div>

            {/* ================= LEDGER TABLE ================= */}
            <div className={styles.tableCard}>
              <div
                style={{
                  padding: "18px 24px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FiLayers color="#0f5c44" size={18} />
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>
                    Live Bank Audit Ledger
                  </h3>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  {transactions.length} audit entries recorded
                </div>
              </div>

              {transactions.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
                  No transaction audit entries recorded yet.
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date &amp; Time</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Amount (₹)</th>
                        <th>Balance After</th>
                        <th>Authorized By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx._id}>
                          <td style={{ fontSize: "0.78rem", color: "#64748b", whiteSpace: "nowrap" }}>
                            {new Date(tx.createdAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                padding: "3px 8px",
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
                          <td style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                            {tx.category || "General"}
                          </td>
                          <td style={{ fontSize: "0.85rem", color: "#334155" }}>
                            {tx.description}
                          </td>
                          <td
                            style={{
                              fontWeight: 800,
                              fontVariantNumeric: "tabular-nums",
                              color: tx.type === "INCOME" ? "#065f46" : tx.type === "EXPENSE" ? "#991b1b" : "#0f172a",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : ""}₹
                            {(tx.amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td
                            style={{
                              fontWeight: 700,
                              color: "#64748b",
                              fontVariantNumeric: "tabular-nums",
                              whiteSpace: "nowrap",
                            }}
                          >
                            ₹{(tx.balanceAfter || 0).toLocaleString("en-IN")}
                          </td>
                          <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            {tx.performedBy?.name || "Admin"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal for editing or reconciling the single bank account */}
        <AccountModal
          isOpen={modalOpen}
          mode={modalMode}
          account={account}
          onClose={() => setModalOpen(false)}
          onSaved={fetchData}
        />
      </div>
    </div>
  );
}
