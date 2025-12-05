import { useEffect } from "react";
import styles from "./RedirectPage.module.css";
import { logScan } from "../../utils/api.endpoints";

const RedirectToInstagram = ({ username = "freezeriaacafe" }) => {
  const instagramAppUrl = `instagram://user?username=${username}`;
  const instagramWebUrl = `https://www.instagram.com/${username}/?hl=en`;

  useEffect(() => {
    const logScanAndRedirect = async () => {
      try {
        await logScan(username);
      } catch (error) {
        console.error("Error logging scan:", error);
      } finally {
        // Try Instagram app first
        window.location.href = instagramAppUrl;

        // Fallback to web
        setTimeout(() => {
          window.location.href = instagramWebUrl;
        }, 1500);
      }
    };

    logScanAndRedirect();
  }, [username]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.heading}>Redirecting to Instagram...</h2>
        <p className={styles.paragraph}>
          If you're not redirected,{" "}
          <a className={styles.link} href={instagramWebUrl}>
            click here
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default RedirectToInstagram;
