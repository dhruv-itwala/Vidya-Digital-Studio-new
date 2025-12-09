// src/components/UI/PopupModal.jsx
import React from "react";
import styles from "./PopupModal.module.css";

const PopupModal = ({ open, status, email, pdfUrl, onClose }) => {
  if (!open) return null;

  const showCloseX = status === "success" || status === "error";

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {showCloseX && (
          <button className={styles.closeX} onClick={onClose}>
            ✕
          </button>
        )}

        {/* LOADING */}
        {status === "loading" && (
          <div className={styles.centerBox}>
            <div className={styles.loader}></div>
            <p className={styles.loadingText}>
              Your quotation is being generated… <br />
              <span>Please wait</span>
            </p>
          </div>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <div className={styles.centerBox}>
            <h3 className={styles.title}>Quotation Generated!</h3>
            <p className={styles.subText}>
              Your quotation has been generated:
              <br />
              <strong>{email && `and is mailed to ${email}`}</strong>
            </p>

            <a href={pdfUrl} target="_blank" className={styles.downloadBtn}>
              ⬇ Download PDF
            </a>
          </div>
        )}

        {/* ERROR */}
        {status === "error" && (
          <div className={styles.centerBox}>
            <h3 className={styles.title}>Failed to Generate</h3>
            <p className={styles.subText}>Something went wrong.</p>

            <button className={styles.tryAgainBtn} onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupModal;
