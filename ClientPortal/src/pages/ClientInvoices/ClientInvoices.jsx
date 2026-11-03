import React, { useEffect, useState, useMemo } from "react";
import clientApi from "../../api/clientAxios";
import styles from "./ClientInvoices.module.css";
import {
  FiFileText,
  FiDownload,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiRefreshCw,
} from "react-icons/fi";
import PaymentModal from "../../components/PaymentModal/PaymentModal";

export default function ClientInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activePaymentInvoice, setActivePaymentInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      // First try dedicated /client-portal/invoices, fallback to /client-portal/me
      const res = await clientApi.get("/client-portal/invoices").catch(() => null);
      if (res?.data?.data) {
        setInvoices(res.data.data);
      } else {
        const meRes = await clientApi.get("/client-portal/me");
        setInvoices(meRes.data?.data?.invoices || []);
      }
    } catch (error) {
      console.error("[ClientInvoices] Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Financial summary numbers
  const summary = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalPending = 0;

    invoices.forEach((inv) => {
      const tot = Number(inv.totalAmount) || Number(inv.amount) || 0;
      const adv = Number(inv.advanceAmount) || 0;
      const rem = typeof inv.remainingAmount === "number" ? inv.remainingAmount : Math.max(0, tot - adv);

      totalBilled += tot;
      totalPaid += (tot - rem);
      totalPending += rem;
    });

    return { totalBilled, totalPaid, totalPending };
  }, [invoices]);

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#0f5c44", fontWeight: 700 }}>
        Loading Invoices &amp; Billing...
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* ================= HEADER ================= */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices &amp; Billing</h1>
          <p className={styles.subtitle}>
            Official Vidya Digital Studio invoices, payment receipts, and direct settlement.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchInvoices(true)}
          disabled={refreshing}
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            color: "#0f172a",
            fontWeight: 600,
            fontSize: "0.82rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <FiRefreshCw size={13} className={refreshing ? "spin" : ""} />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* ================= SUMMARY STRIP ================= */}
      <div className={styles.summaryStrip}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Billed</div>
          <div className={styles.summaryVal}>
            ₹{summary.totalBilled.toLocaleString("en-IN")}
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Settled / Paid</div>
          <div className={styles.summaryVal} style={{ color: "#059669" }}>
            ₹{summary.totalPaid.toLocaleString("en-IN")}
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Outstanding Due</div>
          <div
            className={styles.summaryVal}
            style={{ color: summary.totalPending > 0 ? "#d97706" : "#059669" }}
          >
            ₹{summary.totalPending.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* ================= INVOICES TABLE ================= */}
      <div className={styles.tableCard}>
        {invoices.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice Details</th>
                  <th>Dates</th>
                  <th>Total Amount</th>
                  <th>Pending Balance</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const statusNormalized = (inv.status || "pending").toLowerCase();
                  const total = Number(inv.totalAmount) || Number(inv.amount) || 0;
                  const remaining =
                    typeof inv.remainingAmount === "number"
                      ? inv.remainingAmount
                      : Math.max(0, total - (Number(inv.advanceAmount) || 0));

                  let badgeClass = styles.badgePending;
                  let displayStatus = "pending";

                  if (statusNormalized === "paid" || remaining <= 0) {
                    badgeClass = styles.badgePaid;
                    displayStatus = "paid";
                  } else if (
                    statusNormalized === "partially done" ||
                    statusNormalized === "partial" ||
                    statusNormalized === "partial received" ||
                    inv.advanceAmount > 0
                  ) {
                    badgeClass = styles.badgePartial;
                    displayStatus = "partially done";
                  }

                  const pdfLink = inv.downloadUrl || inv.url;

                  return (
                    <tr key={inv._id || inv.invoiceNumber}>
                      <td>
                        <div className={styles.invoiceNum}>{inv.invoiceNumber}</div>
                        <div className={styles.invoiceTitle}>{inv.title || "Creative Services Retainer"}</div>
                      </td>

                      <td>
                        <div className={styles.dateText}>
                          Issued: {new Date(inv.issueDate || inv.createdAt || Date.now()).toLocaleDateString("en-IN")}
                        </div>
                        {inv.dueDate && (
                          <div className={styles.dateSub}>
                            Due: {new Date(inv.dueDate).toLocaleDateString("en-IN")}
                          </div>
                        )}
                      </td>

                      <td>
                        <div className={styles.amountVal}>₹{total.toLocaleString("en-IN")}</div>
                      </td>

                      <td>
                        <div
                          className={styles.remainingVal}
                          style={{ color: remaining > 0 ? "#dc2626" : "#059669" }}
                        >
                          {remaining > 0 ? `₹${remaining.toLocaleString("en-IN")}` : "₹0 (Settled)"}
                        </div>
                      </td>

                      <td>
                        <span className={`${styles.badge} ${badgeClass}`}>
                          {displayStatus === "paid" && <FiCheckCircle style={{ marginRight: 4 }} />}
                          {displayStatus === "partially done" && <FiCreditCard style={{ marginRight: 4 }} />}
                          {displayStatus === "pending" && <FiClock style={{ marginRight: 4 }} />}
                          {displayStatus}
                        </span>
                      </td>

                      <td>
                        <div className={styles.actionGroup} style={{ justifyContent: "flex-end" }}>
                          {pdfLink && (
                            <a
                              href={pdfLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.downloadBtn}
                              title="Download official PDF"
                            >
                              <FiDownload size={13} /> PDF
                            </a>
                          )}

                          {displayStatus !== "paid" && remaining > 0 && (
                            <button
                              type="button"
                              className={styles.payNowBtn}
                              onClick={() => setActivePaymentInvoice(inv)}
                            >
                              <FiDollarSign size={13} /> Pay Now
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiFileText />
            </div>
            <h3>No Invoices Generated Yet</h3>
            <p>
              Your billing statements and retainer receipts will appear here once finalized by our finance team.
            </p>
          </div>
        )}
      </div>

      {/* ================= PAYMENT MODAL ================= */}
      {activePaymentInvoice && (
        <PaymentModal
          invoice={activePaymentInvoice}
          onClose={() => setActivePaymentInvoice(null)}
        />
      )}
    </div>
  );
}
