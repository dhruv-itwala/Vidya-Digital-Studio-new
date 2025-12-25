// LeaveCard.jsx
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { FaUmbrellaBeach } from "react-icons/fa";
import styles from "./HolidayCard.module.css";

const LeaveCard = () => {
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.holidayCard}>
        <div className={styles.icon}>
          <FaUmbrellaBeach />
        </div>

        <h1 className={styles.holidayTitle}>You’re on Leave</h1>

        <p className={styles.holidayText}>
          Take a break and enjoy your well-earned leave 🌴
        </p>
      </div>
    </div>
  );
};

export default LeaveCard;
