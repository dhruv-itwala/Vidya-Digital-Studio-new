import React from "react";
import styles from "./UploadProgressBar.module.css";

export default function UploadProgressBar({ percent = 0, label = "Uploading..." }) {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span>{label}</span>
        <span>{clampedPercent}%</span>
      </div>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}
