import React from "react";
import styles from "./BusinessCard.module.css";
import { Images } from "../../assets/Data/images";
import { Icon } from "@iconify/react";

const BusinessCard = () => {
  const phoneNumber = "917096413502";
  const message = "Hello! I'm interested in your services.";

  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message,
  )}`;

  const openInstagram = () => {
    const username = "vidyadigitalstudio";

    const appUrl = `instagram://user?username=${username}`;
    const webUrl = `https://www.instagram.com/${username}/`;

    // try app first
    window.location.href = appUrl;

    // fallback to web after delay
    setTimeout(() => {
      window.open(webUrl, "_blank");
    }, 1200);
  };

  // ✅ LOG SCAN ON PAGE LOAD
  useEffect(() => {
    const logPageVisit = async () => {
      try {
        await logScan("vidya-digital-studio"); // any identifier you want
      } catch (error) {
        console.error("Scan log failed:", error);
      }
    };

    logPageVisit();
  }, []);

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logoWrapper}>
          <img src={Images.Circle_logo} alt="Logo" className={styles.logo} />
        </div>

        {/* Title */}
        <h1 className={styles.title}>Vidya Digital Studio</h1>
        <p className={styles.subtitle}>
          We’re a digital and creative agency helping
          <br />
          businesses with intuitive digital experiences,
          <br />
          bold visuals, and effective storytelling.
        </p>

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          <button
            className={styles.cardBtn}
            onClick={() =>
              window.open("https://www.vidyadigitalstudio.com", "_blank")
            }
          >
            🌐 Website
          </button>

          <button
            className={styles.cardBtn}
            onClick={() =>
              window.open("https://vidyadigitalstudio.com/projects", "_blank")
            }
          >
            🎨 Portfolio
          </button>

          {/* <button
            className={styles.cardBtn}
            onClick={() =>
              window.open("https://calendly.com/vidyadigitalstudio", "_blank")
            }
          >
            📄 Schedule a Meeting
          </button> */}

          {/* <button
            className={styles.cardBtn}
            onClick={() =>
              window.open(
                "https://www.vidyadigitalstudio.com/qr-code",
                "_blank"
              )
            }
          >
            🎁 Free Sample
          </button> */}

          <button
            className={styles.cardBtn}
            onClick={() =>
              window.open("https://vidyadigitalstudio.com/contact-us", "_blank")
            }
          >
            📞 Contact Us
          </button>
        </div>

        {/* Social Icons */}
        <div className={styles.socialRow}>
          <Icon
            icon="la:linkedin"
            className={styles.socialIcon}
            onClick={() =>
              window.open(
                "https://www.linkedin.com/company/vidya-digital-studio/",
                "_blank",
              )
            }
          />

          <Icon
            icon="mdi:instagram"
            className={styles.socialIcon}
            onClick={openInstagram}
          />

          <Icon
            icon="material-symbols:mail-outline"
            className={styles.socialIcon}
            onClick={() =>
              (window.location.href = "mailto:contact@vidyadigitalstudio.com")
            }
          />

          <Icon
            icon="ic:baseline-whatsapp"
            className={styles.socialIcon}
            onClick={() => window.open(whatsappLink, "_blank")}
          />
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
