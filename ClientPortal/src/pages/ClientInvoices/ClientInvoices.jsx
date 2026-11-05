import React, { useEffect, useState, useMemo } from "react";
import clientApi from "../../api/clientAxios";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ClientInvoices.module.css";
import {
  FiFileText,
  FiDownload,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiRefreshCw,
  FiArrowUpRight,
  FiShield,
} from "react-icons/fi";
import PaymentModal from "../../components/PaymentModal/PaymentModal";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
  },
};

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
      <div className={styles.loadingContainer}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.loadingCard}
        >
          <span className="spin" style={{ fontSize: "1.4rem", color: "#059669" }}>⟳</span>
          <span style={{ fontWeight: 600, color: "#334155" }}>Loading Invoices &amp; Billing...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={styles.pageContainer}
    >
      {/* ================= HEADER ================= */}
      <motion.div variants={itemVariants} className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices &amp; Billing</h1>
          <p className={styles.subtitle}>
            Official Vidya Digital Studio invoices, payment receipts, and direct online settlement.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={() => fetchInvoices(true)}
          disabled={refreshing}
          className={styles.refreshBtn}
        >
          <FiRefreshCw size={13} className={refreshing ? "spin" : ""} />
          <span>{refreshing ? "Refreshing..." : "Refresh Ledger"}</span>
        </motion.button>
      </motion.div>

      {/* ================= FINANCIAL SUMMARY STRIP ================= */}
      <motion.div variants={itemVariants} className={styles.summaryStrip}>
        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className={styles.summaryCard}
        >
          <div className={styles.summaryLabel}>Total Billed</div>
          <div className={styles.summaryVal}>
            ₹{summary.totalBilled.toLocaleString("en-IN")}
          </div>
          <div className={styles.summarySub}>Total services contracted</div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className={styles.summaryCard}
        >
          <div className={styles.summaryLabel}>Total Settled / Paid</div>
          <div className={`${styles.summaryVal} ${styles.valPaid}`}>
            ₹{summary.totalPaid.toLocaleString("en-IN")}
          </div>
          <div className={styles.summarySub}>Cleared receipts on record</div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className={styles.summaryCard}
        >
          <div className={styles.summaryLabel}>Outstanding Due</div>
          <div
            className={`${styles.summaryVal} ${
              summary.totalPending > 0 ? styles.valPending : styles.valPaid
            }`}
          >
            ₹{summary.totalPending.toLocaleString("en-IN")}
          </div>
          <div className={styles.summarySub}>
            {summary.totalPending > 0 ? "Pending payment action" : "All accounts up to date"}
          </div>
        </motion.div>
      </motion.div>

      {/* ================= INVOICES TABLE CARD ================= */}
      <motion.div variants={itemVariants} className={styles.tableCard}>
        {invoices.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice Details</th>
                  <th>Dates</th>
                  <th>Total Billed</th>
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
                          className={`${styles.remainingVal} ${
                            remaining > 0 ? styles.remainingPending : styles.remainingZero
                          }`}
                        >
                          {remaining > 0 ? `₹${remaining.toLocaleString("en-IN")}` : "₹0 (Settled)"}
                        </div>
                      </td>

                      <td>
                        <span className={`${styles.badge} ${badgeClass}`}>
                          {displayStatus === "paid" && <FiCheckCircle size={12} />}
                          {displayStatus === "partially done" && <FiCreditCard size={12} />}
                          {displayStatus === "pending" && <FiClock size={12} />}
                          <span>{displayStatus}</span>
                        </span>
                      </td>

                      <td>
                        <div className={styles.actionGroup}>
                          {pdfLink && (
                            <motion.a
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              href={pdfLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.downloadBtn}
                              title="Download official PDF Invoice"
                            >
                              <FiDownload size={13} />
                              <span>PDF</span>
                            </motion.a>
                          )}

                          {displayStatus !== "paid" && remaining > 0 && (
                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              type="button"
                              className={styles.payNowBtn}
                              onClick={() => setActivePaymentInvoice(inv)}
                            >
                              <FiDollarSign size={13} />
                              <span>Pay Now</span>
                            </motion.button>
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
            <h3 className={styles.emptyTitle}>No Invoices Generated Yet</h3>
            <p className={styles.emptyDesc}>
              Your official billing statements, retainer receipts, and GST invoices will appear here once finalized by our finance executive.
            </p>
          </div>
        )}
      </motion.div>

      {/* ================= PAYMENT MODAL ================= */}
      <AnimatePresence>
        {activePaymentInvoice && (
          <PaymentModal
            invoice={activePaymentInvoice}
            onClose={() => setActivePaymentInvoice(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
