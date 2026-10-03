import React from "react";
import packageInfo from "../../../package.json";
import styles from "./VersionWatermark.module.css";

export default function VersionWatermark() {
  const version = packageInfo?.version || "1.3.89";

  return (
    <div className={styles.watermark} title={`VIDYACRM v${version}`}>
      <span className={styles.dot} />
      <span>v{version}</span>
    </div>
  );
}
