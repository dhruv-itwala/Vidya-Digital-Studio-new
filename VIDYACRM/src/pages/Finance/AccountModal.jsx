// VIDYACRM/src/pages/Finance/AccountModal.jsx
import React, { useState, useEffect } from "react";
import {
  createCashAccountAPI,
  updateCashAccountAPI,
  adjustAccountBalanceAPI,
} from "../../api/finance.api";
import styles from "./ExpensesPage.module.css";
import toast from "react-hot-toast";
import { FiX, FiCheckCircle, FiShield } from "react-icons/fi";

export default function AccountModal({
  mode = "edit", // "edit" | "adjust" | "create"
  isOpen,
  onClose,
  account,
  onSaved,
}) {
  const [name, setName] = useState("Union Bank of India");
  const [accountNumber, setAccountNumber] = useState("534202010030024");
  const [ifscCode, setIfscCode] = useState("UBIN0553425");
  const [accountHolderName, setAccountHolderName] = useState("Dheemahi Arkeshbhai Joshi");
  const [upiId, setUpiId] = useState("dheemahi2@okhdfcbank");
  const [openingBalance, setOpeningBalance] = useState("0");

  // Adjust mode
  const [newBalance, setNewBalance] = useState("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name || "Union Bank of India");
      setAccountNumber(account.accountNumber || "534202010030024");
      setIfscCode(account.ifscCode || "UBIN0553425");
      setAccountHolderName(account.accountHolderName || "Dheemahi Arkeshbhai Joshi");
      setUpiId(account.upiId || "dheemahi2@okhdfcbank");
      setOpeningBalance(String(account.openingBalance || 0));
      setNewBalance(String(account.currentBalance || 0));
    } else {
      setName("Union Bank of India");
      setAccountNumber("534202010030024");
      setIfscCode("UBIN0553425");
      setAccountHolderName("Dheemahi Arkeshbhai Joshi");
      setUpiId("dheemahi2@okhdfcbank");
      setOpeningBalance("0");
      setNewBalance("0");
    }
    setReason("");
  }, [account, isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      if (mode === "create" || mode === "edit") {
        if (!name.trim()) return toast.error("Bank name is required");
        if (!accountNumber.trim()) return toast.error("Account number is required");

        const payload = {
          name: name.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
          accountHolderName: accountHolderName.trim(),
          upiId: upiId.trim(),
          type: "BANK",
          isDefault: true,
        };

        if (account?._id) {
          await updateCashAccountAPI(account._id, payload);
          toast.success("Studio bank account details updated");
        } else {
          await createCashAccountAPI({
            ...payload,
            openingBalance: Number(openingBalance) || 0,
          });
          toast.success("Studio bank account configured successfully");
        }
      } else if (mode === "adjust") {
        if (newBalance === "" || isNaN(Number(newBalance))) {
          return toast.error("Please enter a valid balance amount");
        }
        await adjustAccountBalanceAPI(account._id, {
          newBalance: Number(newBalance),
          reason: reason.trim() || "Bank passbook statement reconciliation",
        });
        toast.success("Bank account balance reconciled successfully");
      }

      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#ecfdf5",
                color: "#0f5c44",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiShield size={18} />
            </div>
            <div>
              <h3 className={styles.modalTitle} style={{ margin: 0 }}>
                {mode === "adjust"
                  ? "Reconcile Bank Balance"
                  : account?._id
                  ? "Edit Studio Bank Details"
                  : "Setup Studio Bank Account"}
              </h3>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Primary official account for all studio payables &amp; receivables
              </div>
            </div>
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {(mode === "create" || mode === "edit") && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Bank Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Union Bank of India"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Account Number <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. 534202010030024"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>IFSC Code</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. UBIN0553425"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Account Holder Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. Dheemahi Arkeshbhai Joshi"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>UPI ID (VPA)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. dheemahi2@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                </div>

                {!account?._id && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Opening Balance (₹)</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      placeholder="0"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            {mode === "adjust" && (
              <>
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    padding: "16px",
                    borderRadius: "10px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, letterSpacing: "0.04em" }}>
                    CURRENT RECORDED SYSTEM BALANCE
                  </div>
                  <div
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      color: "#0f5c44",
                      margin: "4px 0",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ₹{(account?.currentBalance || 0).toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#475569" }}>
                    {account?.name} · A/C: {account?.accountNumber}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Actual Bank Statement Balance (₹) <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="number"
                    className={styles.formInput}
                    placeholder="Enter balance from actual bank passbook / statement"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reconciliation Remarks / Audit Note</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Monthly statement reconciliation"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={submitting}>
              {submitting
                ? "Saving..."
                : mode === "adjust"
                ? "Confirm Reconciled Balance"
                : "Save Bank Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
