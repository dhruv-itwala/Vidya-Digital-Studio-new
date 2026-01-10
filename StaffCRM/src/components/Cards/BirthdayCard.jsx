import styles from "./BirthdayCard.module.css";

const BirthdayCard = ({ people = [] }) => {
  if (!people.length) return null;

  return (
    <div className={styles.card}>
      <div className={styles.icon}>🎉</div>

      <div className={styles.content}>
        <h3>Today’s Birthday{people.length > 1 ? "s" : ""}!</h3>

        <p>
          {people.map((p) => p.name).join(", ")}{" "}
          {people.length > 1 ? "are" : "is"} celebrating today 🎂
        </p>

        <span className={styles.sub}>Don’t forget to wish them!</span>
      </div>
    </div>
  );
};

export default BirthdayCard;
