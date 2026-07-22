import styles from "./WeeklyHrs.module.css";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const WeeklyHrs = ({ attendance }) => {
  const { weeklySeconds } = attendance;
  const REQUIRED_SECONDS = attendance.weeklyRequiredSeconds;

  const percentage = Math.min((weeklySeconds / REQUIRED_SECONDS) * 100, 100);

  const remainingSeconds = Math.max(REQUIRED_SECONDS - weeklySeconds, 0);

  const hours = Math.floor(weeklySeconds / 3600);
  const minutes = Math.floor((weeklySeconds % 3600) / 60);
  const seconds = weeklySeconds % 60;

  const remainingHours = (remainingSeconds / 3600).toFixed(2);

  const isCompleted = weeklySeconds >= REQUIRED_SECONDS;

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Weekly Work Progress</h3>

      <div className={styles.progressContainer}>
        <CircularProgressbar
          value={percentage}
          text={`${hours}h ${minutes}m ${seconds}s`}
          counterClockwise
          styles={buildStyles({
            textSize: "12px",
            pathColor: "var(--color-primary)",
            textColor: "#111",
            trailColor: "#e5e7eb",
          })}
        />
      </div>

      <div className={styles.details}>
        <p>
          Required: <strong>{(REQUIRED_SECONDS / 3600).toFixed(2)} hrs</strong>
        </p>
        <p>
          Remaining: <strong>{remainingHours} hrs</strong>
        </p>

        {isCompleted && (
          <p className={styles.completed}>✔ Weekly Target Achieved</p>
        )}
      </div>
    </div>
  );
};

export default WeeklyHrs;
