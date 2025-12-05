import { useEffect } from "react";
import styles from "./RedirectPage.module.css";

const RedirectToYoutube = ({ url }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.heading}>Redirecting to YouTube...</h2>
        <p className={styles.paragraph}>
          If you're not redirected,{" "}
          <a className={styles.link} href={url}>
            click here
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default RedirectToYoutube;
