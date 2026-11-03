// VIDYACRM/src/pages/Admin/TerminationDetailsModal.jsx
import React, { useState } from "react";
import { inactiveUserAPI } from "../../api/admin.api";
import styles from "./TerminationDetailsModal.module.css";
import toast from "react-hot-toast";
import { FiX, FiSlash, FiUserCheck, FiUser, FiCalendar, FiClock } from "react-icons/fi";
import InlineLoader from "../../components/UI/InlineLoader";

export default function TerminationDetailsModal({ employee, onClose, onReactivated }) {
  const [reactivating, setReactivating] = useState(false);

  if (!employee) return null;

  const formatDate = (d) => {
    if (!d) return "N/A";
    const date = new Date(d);
    return isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  const handleReactivate = async () => {
    const ok = confirm(`Reactivate / Re-hire ${employee.name}? This will restore their active account status.`);
    if (!ok) return;

    try {
      setReactivating(true);
      await inactiveUserAPI(employee._id);
      toast.success(`${employee.name} reactivated and restored to active roster.`);
      if (onReactivated) onReactivated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to reactivate employee"
      );
    } finally {
      setReactivating(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrap}>
              <FiSlash />
            </div>
            <h3 className={styles.title}>Termination Record</h3>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Close"
          >
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Employee Card */}
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

          {/* Details Grid */}
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Account Status:</span>
              <span className={styles.detailValue} style={{ color: "#dc2626" }}>
                Terminated (Deactivated)
              </span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Exit Date:</span>
              <span className={styles.detailValue}>
                {formatDate(employee.terminationDate || employee.updatedAt)}
              </span>
            </div>

            {employee.terminatedBy && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Terminated By:</span>
                <span className={styles.detailValue}>
                  {typeof employee.terminatedBy === "object"
                    ? employee.terminatedBy.name || employee.terminatedBy.email
                    : "Admin / HR"}
                </span>
              </div>
            )}

            {employee.terminatedAt && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Recorded On:</span>
                <span className={styles.detailValue}>
                  {formatDate(employee.terminatedAt)}
                </span>
              </div>
            )}

            {/* Reason Box */}
            <div className={styles.reasonBox}>
              <div className={styles.reasonTitle}>Official Exit Reason &amp; Remarks</div>
              <p className={styles.reasonText}>
                {employee.terminationReason || "No specific reason provided."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.rehireBtn}
            onClick={handleReactivate}
            disabled={reactivating}
          >
            {reactivating ? (
              <InlineLoader size={12} color="#065f46" />
            ) : (
              <FiUserCheck size={14} />
            )}
            <span>Re-activate / Re-hire</span>
          </button>
          <button
            type="button"
            className={styles.closeActionBtn}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

