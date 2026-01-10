import { useEffect } from "react";
import confetti from "canvas-confetti";
import { FaUmbrellaBeach, FaStar } from "react-icons/fa";
import styles from "./HolidayCard.module.css";

const HolidayCard = ({ holidayName }) => {
  useEffect(() => {
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.6 },
      colors: [
        "#0f5c44", // deep forest
        "#f25c05", // vibrant orange
        "#ef4f6e", // coral red
        "#f6c7dc", // blush pink
      ],
    });
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.holidayCard}>
        {/* Floating Icon */}
        <div className={styles.icon}>
          <FaUmbrellaBeach />
        </div>

        <h1 className={styles.holidayTitle}>{holidayName}</h1>

        <p className={styles.holidayText}>
          Take a pause, breathe easy, and enjoy your well , earned holiday.
        </p>

        {/* Decorative Icons */}
        <div className={styles.stars}>
          <FaStar />
          <FaStar />
          <FaStar />
        </div>
      </div>
    </div>
  );
};

export default HolidayCard;
