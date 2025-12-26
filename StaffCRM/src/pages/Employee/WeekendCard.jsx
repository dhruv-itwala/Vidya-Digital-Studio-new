// WeekendCard.jsx
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { FaUmbrellaBeach, FaCoffee } from "react-icons/fa";
import styles from "./HolidayCard.module.css";

const WeekendCard = ({ day }) => {
  // day: 0 = Sunday, 6 = Saturday

  useEffect(() => {
    if (day === 0 || day === 6) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [day]);

  const isSunday = day === 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.holidayCard}>
        <div className={styles.icon}>
          {isSunday ? <FaCoffee /> : <FaUmbrellaBeach />}
        </div>

        <h1 className={styles.holidayTitle}>
          {isSunday ? "It’s Sunday" : "It’s Saturday"}
        </h1>

        <p className={styles.holidayText}>
          {isSunday
            ? "Slow down, sip something warm, and reset for an amazing week ahead ☕🌿"
            : "Hello Saturday! Time to relax, explore, and enjoy every moment 🎶🎉"}
        </p>
      </div>
    </div>
  );
};

export default WeekendCard;
