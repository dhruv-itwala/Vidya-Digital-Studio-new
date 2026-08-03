import React, { useEffect, useState } from "react";
import styles from "./SalesTargetWidget.module.css";
import { getMyTargetsAPI } from "../../../api/target.api";
import { FiTarget, FiTrendingUp } from "react-icons/fi";

const SalesTargetWidget = () => {
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTarget = async () => {
      try {
        const res = await getMyTargetsAPI();
        if (res.data.targets && res.data.targets.length > 0) {
          setTarget(res.data.targets[0]);
        }
      } catch (err) {
        console.error("Failed to fetch target", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTarget();
  }, []);

  if (loading) return null;
  if (!target) return null; // No target set for this month

  const progress = Math.min(100, Math.round((target.achievedValue / target.targetValue) * 100)) || 0;
  
  // Format currency
  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className={styles.targetCard}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <FiTarget />
        </div>
        <div>
          <h3 className={styles.title}>Monthly Sales Target</h3>
          <p className={styles.subtitle}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBlock}>
          <span className={styles.label}>Achieved</span>
          <span className={styles.value}>{formatter.format(target.achievedValue)}</span>
        </div>
        <div className={styles.statBlockRight}>
          <span className={styles.label}>Goal</span>
          <span className={styles.value}>{formatter.format(target.targetValue)}</span>
        </div>
      </div>

      <div className={styles.progressBarBg}>
        <div className={styles.progressBarFill} style={{ width: `${progress}%` }}></div>
      </div>

      <div className={styles.footer}>
        <span>{progress}% Completed</span>
        {progress >= 100 && <span className={styles.success}><FiTrendingUp /> Target Hit!</span>}
      </div>
    </div>
  );
};

export default SalesTargetWidget;
