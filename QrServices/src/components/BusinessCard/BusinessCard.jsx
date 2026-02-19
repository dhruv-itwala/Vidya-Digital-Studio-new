import React, { useEffect } from "react";
import styles from "./BusinessCard.module.css";
import { Images } from "../../assets/Data/images";
import { Icon } from "@iconify/react";
import { logScan } from "../../utils/api.endpoints";
import { v4 as uuidv4 } from "uuid";

const BusinessCard = () => {
  const phoneNumber = "917096413502";
  const message = "Hello! I'm interested in your services.";

  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  useEffect(() => {
    let deviceId = localStorage.getItem("deviceId");

    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("deviceId", deviceId);
    }

    logScan({
      deviceId,
      label: "vidya-digital-studio-page",
    });
  }, []);

  const openLink = (url) => {
    window.location.href = url;
  };

  const openInstagram = () => {
    window.open("/ig.html", "_blank");
  };

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <div className={styles.logoWrapper}>
          <img src={Images.Circle_logo} alt="Logo" className={styles.logo} />
        </div>

        <h1 className={styles.title}>Vidya Digital Studio</h1>
        <p className={styles.description}>
          The All-in-one Creative & Digital Studio for Marketing, Design, Web,
          and 3D for brands that think, feel, and dream in more than one
          dimension
        </p>
        <div className={styles.socialRow}>
          <Icon
            icon="la:linkedin"
            className={styles.socialIcon}
            onClick={() =>
              openLink("https://www.linkedin.com/company/vidya-digital-studio/")
            }
          />

          <Icon
            icon="mdi:instagram"
            className={styles.socialIcon}
            onClick={openInstagram}
          />
          <Icon
            icon="mdi:facebook"
            className={styles.socialIcon}
            onClick={() =>
              openLink("https://www.facebook.com/share/16sYVrBt8w/")
            }
          />

          <Icon
            icon="material-symbols:mail-outline"
            className={styles.socialIcon}
            onClick={() => openLink("mailto:contact@vidyadigitalstudio.com")}
          />

          <Icon
            icon="ic:baseline-whatsapp"
            className={styles.socialIcon}
            onClick={() => openLink(whatsappLink)}
          />
        </div>
        <div className={styles.buttonGroup}>
          <button
            className={styles.cardBtn}
            onClick={() => openLink("https://www.vidyadigitalstudio.com")}
          >
            🌐 Visit our Website
          </button>

          <button
            className={styles.cardBtn}
            onClick={() => openLink("https://vidyadigitalstudio.com/projects")}
          >
            💼 Discover Our Projects
          </button>

          <button
            className={styles.cardBtn}
            onClick={() =>
              openLink("https://vidyadigitalstudio.com/contact-us")
            }
          >
            📞 Let’s Build Together - Contact us today!
          </button>
          <button
            className={styles.cardBtn}
            onClick={() =>
              openLink("https://www.instagram.com/reel/DSogDWmgtDL")
            }
          >
            ✨ Our Story in 60 Seconds
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
