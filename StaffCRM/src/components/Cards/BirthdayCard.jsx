import styles from "./BirthdayCard.module.css";

const BirthdayCard = ({ people = [] }) => {
  if (!people.length) return null;

  return (
    <div className={styles.card}>
      <span className={styles.icon}>🎂</span>

      <div className={styles.text}>
        <strong>
          Wish you a very Happy Birthday{people.length > 1 ? "s" : ""}
        </strong>
        <span>
          {" - "}
          {people.map((p) => p.name).join(", ")}
        </span>
      </div>
    </div>
  );
};

export default BirthdayCard;
