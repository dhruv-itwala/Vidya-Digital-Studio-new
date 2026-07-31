import styles from "./WeeklyHrs.module.css";

const WeeklyHrs = ({ attendance }) => {
  const { weeklySeconds } = attendance;
  const REQUIRED_SECONDS = attendance.weeklyRequiredSeconds || (40 * 3600);

  const percentage = Math.min((weeklySeconds / REQUIRED_SECONDS) * 100, 100).toFixed(0);
  const remainingSeconds = Math.max(REQUIRED_SECONDS - weeklySeconds, 0);

  const formatHours = (secs) => {
    return (secs / 3600).toFixed(2);
  };

  const isCompleted = weeklySeconds >= REQUIRED_SECONDS;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>WEEKLY WORK PROGRESS</h3>
        <span className={styles.pill}>{percentage}% ACHIEVED</span>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressLabels}>
          <span className={styles.doneText}>{formatHours(weeklySeconds)} hrs done</span>
          <span className={styles.targetText}>Target: {formatHours(REQUIRED_SECONDS)} hrs</span>
        </div>

        <div className={styles.progressBarContainer}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${percentage}%` }}
          >
            <div className={styles.thumb}></div>
          </div>
        </div>
      </div>

      <div className={styles.statsBox}>
        <div className={styles.statCol}>
          <span className={styles.statLabel}>REQUIRED HOURS</span>
          <span className={styles.statValueGreen}>{formatHours(REQUIRED_SECONDS)} hrs</span>
        </div>
        <div className={styles.statCol}>
          <span className={styles.statLabel}>REMAINING HOURS</span>
          <span className={styles.statValueOrange}>{formatHours(remainingSeconds)} hrs</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyHrs;
