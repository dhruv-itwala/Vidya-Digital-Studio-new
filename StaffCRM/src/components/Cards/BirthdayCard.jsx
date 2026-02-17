import { useEffect } from "react";
import styles from "./BirthdayCard.module.css";
import confetti from "canvas-confetti";
import { useAuth } from "../../context/AuthContext";

const BirthdayCard = ({ people = [] }) => {
  const { user } = useAuth();

  if (!Array.isArray(people) || people.length === 0) return null;

  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );

  const todayDay = today.getDate();
  const todayMonth = today.getMonth();

  const todaysBirthdays = people.filter((person) => {
    if (!person.dateOfBirth) return false;
    const dob = new Date(person.dateOfBirth);
    return dob.getDate() === todayDay && dob.getMonth() === todayMonth;
  });

  if (todaysBirthdays.length === 0) return null;

  const isMyBirthday = todaysBirthdays.some((p) => p.name === user?.name);

  const otherBirthdays = todaysBirthdays.filter((p) => p.name !== user?.name);

  // 🎉 Confetti only for me
  useEffect(() => {
    if (isMyBirthday) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });
    }
  }, [isMyBirthday]);

  return (
    <div className={styles.card}>
      <span className={styles.icon}>🎂</span>

      <div className={styles.text}>
        {/* 🎉 My Birthday */}
        {isMyBirthday && <strong>Happy Birthday, {user?.name}! 🎉</strong>}

        {/* 🎈 Others Birthday */}
        {otherBirthdays.length > 0 && (
          <span className={styles.names}>
            {isMyBirthday && <br />}
            {otherBirthdays.length === 1
              ? `Today is ${otherBirthdays[0].name}'s birthday. Wish them! 🎂`
              : `Today is ${otherBirthdays
                  .map((p) => p.name)
                  .join(", ")}'s birthday. Wish them! 🎂`}
          </span>
        )}
      </div>
    </div>
  );
};

export default BirthdayCard;
