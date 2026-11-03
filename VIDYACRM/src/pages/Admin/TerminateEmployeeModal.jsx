// VIDYACRM/src/pages/Admin/TerminateEmployeeModal.jsx
import React, { useState } from "react";
import { terminateUserAPI } from "../../api/admin.api";
import styles from "./TerminateEmployeeModal.module.css";
import toast from "react-hot-toast";
import { FiX, FiAlertTriangle, FiUserX, FiUser } from "react-icons/fi";
import InlineLoader from "../../components/UI/InlineLoader";

const REASON_CATEGORIES = [
  "Performance Issues",
  "Voluntary Resignation",
  "Contract Completion",
  "Policy Violation / Misconduct",
  "Excessive Absenteeism",
  "Mutual Agreement",
  "Role Redundancy / Layoff",
  "Other",
];

export default function TerminateEmployeeModal({ employee, onClose, onSuccess }) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [terminationDate, setTerminationDate] = useState(todayStr);
  const [selectedCategory, setSelectedCategory] = useState("Performance Issues");
  const [reasonDetails, setReasonDetails] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!employee) return null;

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!terminationDate) {
      toast.error("Please specify the termination date");
      return;
    }

    const trimmedNotes = reasonDetails.trim();
    if (!trimmedNotes && selectedCategory === "Other") {
      toast.error("Please provide a detailed explanation for 'Other'");
      return;
    }

    if (!confirmed) {
      toast.error("Please check the confirmation box before terminating");
      return;
    }

    const fullReason = trimmedNotes
      ? `[${selectedCategory}] ${trimmedNotes}`
      : selectedCategory;

    try {
      setSubmitting(true);
      const res = await terminateUserAPI(employee._id, {
        terminationDate,
        terminationReason: fullReason,
      });

      if (res.data?.success) {
        toast.success(res.data.message || `${employee.name} terminated and deactivated successfully`);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to terminate employee"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* ================= HEADER ================= */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.iconWrap}>
              <FiUserX />
            </div>
            <div>
              <h3 className={styles.title}>Terminate Employee</h3>
              <p className={styles.subtitle}>
                Deactivate account and document official exit record
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={submitting}
            title="Close"
          >
            <FiX />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {/* Warning Callout */}
            <div className={styles.warningBox}>
              <FiAlertTriangle className={styles.warningIcon} />
              <p className={styles.warningText}>
                <strong>Warning:</strong> Terminating this employee will immediately deactivate their account, revoke CRM and attendance access, and exclude them from upcoming payroll cycles.
              </p>
            </div>

            {/* Employee Summary Card */}
            <div className={styles.employeeCard}>
              {employee.profilePicture?.url ? (
                <img
                  src={employee.profilePicture.url}
                  alt={employee.name}
                  className={styles.employeeAvatar}
                />
              ) : (
                <div className={styles.employeeAvatarPlaceholder}>
                  <FiUser />
                </div>
              )}
              <div className={styles.employeeMeta}>
                <span className={styles.employeeName}>{employee.name}</span>
                <span className={styles.employeeSub}>
                  {employee.designation || employee.role?.toUpperCase()} &bull; {employee.email}
                </span>
              </div>
            </div>

            {/* Termination Date */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Termination / Exit Date <span className={styles.requiredStar}>*</span>
              </label>
              <input
                type="date"
                className={styles.input}
                value={terminationDate}
                onChange={(e) => setTerminationDate(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {/* Reason Category */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Termination Category <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.tagsGrid}>
                {REASON_CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    disabled={submitting}
                    className={`${styles.tagBtn} ${
                      selectedCategory === cat ? styles.tagBtnActive : ""
                    }`}
                    onClick={() => handleCategoryClick(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Reason Notes */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Detailed Reason &amp; Exit Remarks
                <span style={{ fontSize: "0.75rem", fontWeight: "normal", color: "#64748b" }}>
                  (Handover notes, official justification)
                </span>
              </label>
              <textarea
                className={styles.textarea}
                placeholder="Enter specific notes, performance observations, or exit remarks..."
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                disabled={submitting}
                rows={3}
              />
            </div>

            {/* Confirmation Checkbox */}
            <label className={styles.confirmLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={submitting}
              />
              <span className={styles.confirmText}>
                I confirm the termination of <strong>{employee.name}</strong> effective on{" "}
                <strong>{terminationDate || "selected date"}</strong>. Deactivate this account immediately.
              </span>
            </label>
          </div>

          {/* ================= FOOTER ================= */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.terminateSubmitBtn}
              disabled={submitting || !confirmed}
            >
              {submitting ? (
                <>
                  <InlineLoader size={14} color="#ffffff" />
                  <span>Terminating...</span>
                </>
              ) : (
                <>
                  <FiUserX size={16} />
                  <span>Terminate &amp; Deactivate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

