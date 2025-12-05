import styles from "./PNF.module.css";
import { Link } from "react-router-dom";

export default function PNF() {
  return (
    <div className={styles.container}>
      <div className={styles.svgWrapper}>
        <img
          src="/PageNotFound.svg"
          alt="404 Not Found"
          className={styles.image}
        />
      </div>
      <div className={styles.content}>
        <h1>Oops! Page Not Found</h1>
        <p>
          Looks like you're trying to explore uncharted design territory. <br />
          This page doesn't exist... yet.
        </p>
        <Link to="/" className={styles.button}>
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
