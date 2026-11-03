// VIDYACRM/src/pages/Finance/ExpensePayoutModal.jsx
import React, { useState, useEffect } from "react";
import { recordExpensePayoutAPI, getCashAccountsAPI } from "../../api/finance.api";
import styles from "./ExpensesPage.module.css";
import toast from "react-hot-toast";
import { FiX, FiCheckCircle } from "react-icons/fi";

export default function ExpensePayoutModal({ isOpen, onClose, expense, onPaid }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && expense) {
      setAmount(expense.outstandingAmount || expense.amount || "");
      setNotes(`Payment for ${expense.name}`);
      getCashAccountsAPI()
        .then((res) => {
          if (res.data?.success) {
            const list = res.data.data || [];
            setAccounts(list);
            const defaultAcc = list.find((a) => a.isDefault) || list[0];
            if (defaultAcc) setSelectedAccountId(defaultAcc._id);
          }
        })
        .catch((err) => console.error("Error loading accounts:", err));
    }
  }, [isOpen, expense]);

  if (!isOpen || !expense) return null;

  const selectedAccount = accounts.find((a) => a._id === selectedAccountId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return toast.error("Please enter a valid payout amount.");
    }
    if (!selectedAccountId) {
      return toast.error("Please select a bank or cash account.");
    }

    try {
      setSubmitting(true);
      const res = await recordExpensePayoutAPI(expense._id, {
        cashAccountId: selectedAccountId,
        amount: numAmount,
        notes,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Payment recorded successfully!");
        onPaid();
        onClose();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            Record Payment for: {expense.name}
          </h3>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: "12px 16px",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700 }}>
                  TOTAL BILL AMOUNT
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#14532d" }}>
                  ₹{expense.amount?.toLocaleString("en-IN")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.75rem", color: "#991b1b", fontWeight: 700 }}>
                  OUTSTANDING DUE
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#b91c1c" }}>
                  ₹{(expense.outstandingAmount ?? expense.amount)?.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Disburse from Account</label>
              <select
                className={styles.formSelect}
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                required
              >
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.type}) — Available: ₹{(a.currentBalance || 0).toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Payment Amount (₹)</label>
              <input
                type="number"
                className={styles.formInput}
                value={amount}
                max={expense.outstandingAmount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {selectedAccount && (
                <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                  Account balance after payment:{" "}
                  <strong>
                    ₹{Math.max(0, (selectedAccount.currentBalance || 0) - (Number(amount) || 0)).toLocaleString("en-IN")}
                  </strong>
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Transaction Reference / Notes</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g. UPI Ref / Bank Transfer / Card"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={submitting}>
              <FiCheckCircle size={15} />
              <span>{submitting ? "Processing..." : "Confirm & Deduct Balance"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

