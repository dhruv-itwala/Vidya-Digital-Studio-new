// VIDYACRM/src/pages/Invoices/InvoiceStatusModal.jsx
import React, { useState, useEffect } from "react";
import { updateInvoiceStatusAPI } from "../../api/invoice.api";
import { getCashAccountsAPI } from "../../api/finance.api";
import styles from "./InvoicePreviewModal.module.css";
import toast from "react-hot-toast";
import { FiX, FiCheckCircle, FiClock, FiDollarSign } from "react-icons/fi";

export default function InvoiceStatusModal({ isOpen, onClose, invoice, onUpdated }) {
  const [status, setStatus] = useState("received"); // "received" | "partial received" | "pending"
  const [receivedAmount, setReceivedAmount] = useState("");
  const [cashAccountId, setCashAccountId] = useState("");
  const [recordInBank, setRecordInBank] = useState(true);
  const [notes, setNotes] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && invoice) {
      const remaining =
        typeof invoice.remainingAmount === "number"
          ? invoice.remainingAmount
          : Math.max(0, (invoice.totalAmount || 0) - (invoice.advanceAmount || 0));

      if (remaining > 0) {
        setStatus("received");
        setReceivedAmount(remaining);
      } else {
        setStatus("received");
        setReceivedAmount(0);
      }

      setNotes(`Payment for ${invoice.invoiceNumber}`);

      getCashAccountsAPI()
        .then((res) => {
          if (res.data?.success) {
            const list = res.data.data || [];
            setAccounts(list);
            const def = list.find((a) => a.isDefault) || list[0];
            if (def) setCashAccountId(def._id);
          }
        })
        .catch((err) => console.warn("Failed to load accounts for invoice status:", err));
    }
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const total = Number(invoice.totalAmount) || 0;
  const currentAdvance = Number(invoice.advanceAmount) || 0;
  const currentDue = Math.max(0, total - currentAdvance);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (status === "partial received") {
      const added = Number(receivedAmount);
      if (!added || added <= 0) {
        return toast.error("Please enter a valid partial amount received.");
      }
      if (added > currentDue) {
        return toast.error(`Received amount cannot exceed current balance due (₹${currentDue.toLocaleString("en-IN")})`);
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        status,
        receivedAmount: status === "partial received" ? Number(receivedAmount) : currentDue,
        cashAccountId: recordInBank ? cashAccountId : null,
        notes,
      };

      const res = await updateInvoiceStatusAPI(invoice._id, payload);
      if (res.data?.success) {
        toast.success(`Invoice status updated to ${status}`);
        onUpdated();
        onClose();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.dialog}
        style={{ maxWidth: "520px", padding: "0" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.iconBadge} style={{ background: "#ecfdf5", color: "#0f5c44" }}>
              <FiCheckCircle size={16} />
            </div>
            <span className={styles.titleText}>
              Update Invoice Payment Status: {invoice.invoiceNumber}
            </span>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          {/* Client & Amount summary strip */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "14px 16px",
              marginBottom: "18px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700 }}>
                TOTAL INVOICE
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                ₹{total.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700 }}>
                ADVANCE PAID
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f5c44" }}>
                ₹{currentAdvance.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#991b1b", fontWeight: 700 }}>
                BALANCE DUE
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#dc2626" }}>
                ₹{currentDue.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Status Choice */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 700, display: "block", marginBottom: "8px" }}>
              Select Payment Status
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setStatus("received")}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: status === "received" ? "2px solid #0f5c44" : "1px solid #cbd5e1",
                  background: status === "received" ? "#ecfdf5" : "#ffffff",
                  color: status === "received" ? "#065f46" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                Received (Full)
              </button>
              <button
                type="button"
                onClick={() => setStatus("partial received")}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: status === "partial received" ? "2px solid #7c3aed" : "1px solid #cbd5e1",
                  background: status === "partial received" ? "#f5f3ff" : "#ffffff",
                  color: status === "partial received" ? "#6d28d9" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                Partial Received
              </button>
              <button
                type="button"
                onClick={() => setStatus("pending")}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: status === "pending" ? "2px solid #d97706" : "1px solid #cbd5e1",
                  background: status === "pending" ? "#fffbeb" : "#ffffff",
                  color: status === "pending" ? "#b45309" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                Pending
              </button>
            </div>
          </div>

          {/* Partial Amount Input */}
          {status === "partial received" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Partial Amount Received Now (₹) <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="number"
                max={currentDue}
                placeholder="Enter amount collected"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                }}
                required
              />
              <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                Remaining balance after this collection:{" "}
                <strong>
                  ₹{Math.max(0, currentDue - (Number(receivedAmount) || 0)).toLocaleString("en-IN")}
                </strong>
              </span>
            </div>
          )}

          {/* Deposit to Bank Account checkbox */}
          {(status === "received" || status === "partial received") && currentDue > 0 && (
            <div style={{ marginBottom: "16px", background: "#f8fafc", padding: "12px", borderRadius: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={recordInBank}
                  onChange={(e) => setRecordInBank(e.target.checked)}
                />
                Credit to Studio Bank / Cash Account
              </label>

              {recordInBank && (
                <div style={{ marginTop: "10px" }}>
                  <select
                    value={cashAccountId}
                    onChange={(e) => setCashAccountId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.8125rem",
                      background: "#ffffff",
                    }}
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} ({a.type}) — Current: ₹{(a.currentBalance || 0).toLocaleString("en-IN")}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 700, display: "block", marginBottom: "6px" }}>
              Reference / Payment Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Received via NEFT / GPay / Cash"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.875rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                background: "#0f5c44",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 700,
              }}
            >
              {submitting ? "Updating..." : "Save Payment Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

