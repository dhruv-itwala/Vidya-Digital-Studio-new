import React, { useEffect } from "react";
import styles from "./BusinessCard.module.css";
import { Images } from "../../assets/Data/images";
import { Icon } from "@iconify/react";
import { logScan } from "../../utils/api.endpoints";

const BusinessCard = () => {
  const phoneNumber = "917096413502";
  const message = "Hello! I'm interested in your services.";

  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  /* =========================
     ✅ 1. LOG PAGE VISIT (QR SCAN)
  ========================== */
  useEffect(() => {
    logScan("vidya-digital-studio-page");
  }, []);

  /* =========================
     ✅ 2. UNIVERSAL LINK HANDLER
     (logs + opens correctly)
  ========================== */
  const openLink = (url, label) => {
    logScan(label); // optional click tracking
    window.location.href = url; // NEVER window.open on mobile
  };

  /* =========================
     ✅ 3. INSTAGRAM DEEP LINK
  ========================== */
  const openInstagram = () => {
    const username = "vidyadigitalstudio";

    logScan("instagram-click");

    const appUrl = `instagram://user?username=${username}`;
    const webUrl = `https://www.instagram.com/${username}/`;

    // try app
    window.location.href = appUrl;

    // fallback
    setTimeout(() => {
      window.location.href = webUrl;
    }, 1200);
  };

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <div className={styles.logoWrapper}>
          <img src={Images.Circle_logo} alt="Logo" className={styles.logo} />
        </div>

        <h1 className={styles.title}>Vidya Digital Studio</h1>

        <div className={styles.buttonGroup}>
          <button
            className={styles.cardBtn}
            onClick={() =>
              openLink("https://www.vidyadigitalstudio.com", "website-click")
            }
          >
            🌐 Website
          </button>

          <button
            className={styles.cardBtn}
            onClick={() =>
              openLink(
                "https://vidyadigitalstudio.com/projects",
                "portfolio-click",
              )
            }
          >
            🎨 Portfolio
          </button>

          <button
            className={styles.cardBtn}
            onClick={() =>
              openLink(
                "https://vidyadigitalstudio.com/contact-us",
                "contact-click",
              )
            }
          >
            📞 Contact Us
          </button>
        </div>

        <div className={styles.socialRow}>
          <Icon
            icon="la:linkedin"
            className={styles.socialIcon}
            onClick={() =>
              openLink(
                "https://www.linkedin.com/company/vidya-digital-studio/",
                "linkedin-click",
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
              openLink("mailto:contact@vidyadigitalstudio.com", "mail-click")
            }
          />

          <Icon
            icon="ic:baseline-whatsapp"
            className={styles.socialIcon}
            onClick={() => openLink(whatsappLink, "whatsapp-click")}
          />
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
