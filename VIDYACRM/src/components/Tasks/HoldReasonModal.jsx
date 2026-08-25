import React, { useState, useEffect } from "react";
import { FiPauseCircle, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import styles from "./HoldReasonModal.module.css";

export default function HoldReasonModal({
  isOpen,
  task,
  initialReason = "",
  onConfirm,
  onCancel,
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason(initialReason || task?.holdReason || "");
    }
  }, [isOpen, initialReason, task]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!reason.trim()) {
      return toast.error("Please enter a reason for putting the task on hold.");
    }
    onConfirm(reason.trim());
  };

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.titleGroup}>
            <div className={styles.iconWrapper}>
              <FiPauseCircle className={styles.pauseIcon} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>Put Task On Hold</h3>
              <p className={styles.modalSubtitle}>
                {task?.name ? (
                  <>
                    Task: <strong>{task.name}</strong>
                  </>
                ) : (
                  "Please provide a reason for putting this task on hold"
                )}
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onCancel} title="Close">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              Reason for Hold <span className={styles.required}>*</span>
            </label>
            <textarea
              autoFocus
              className={styles.textarea}
              placeholder="e.g., Awaiting client assets / Pending design review / Blocked on dependency..."
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button type="submit" className={styles.confirmBtn}>
              Confirm & Put On Hold
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
