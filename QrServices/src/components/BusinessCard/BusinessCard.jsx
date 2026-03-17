import React, { useEffect, useCallback } from "react";
import styles from "./BusinessCard.module.css";
import { Images } from "../../assets/Data/images";
import { Icon } from "@iconify/react";
import { logScan } from "../../utils/api.endpoints";
import { v4 as uuidv4 } from "uuid";

const LINKS = {
  website: {
    url: "https://www.vidyadigitalstudio.com",
    newTab: true,
  },
  projects: {
    url: "https://vidyadigitalstudio.com/projects",
    newTab: true,
  },
  modeling: {
    url: "https://vidyadigitalstudio.com/projects/3d-modelling",
    newTab: true,
  },
  contact: {
    url: "https://vidyadigitalstudio.com/contact-us",
    newTab: true,
  },
  linkedin: {
    url: "https://www.linkedin.com/company/vidya-digital-studio/",
    newTab: true,
  },
  facebook: {
    url: "https://www.facebook.com/share/16sYVrBt8w/",
    newTab: true,
  },
  instagram: {
    url: "/ig.html",
    newTab: true,
  },
  reel: {
    url: "https://www.instagram.com/reel/DSogDWmgtDL",
    newTab: true,
  },
  email: {
    url: "mailto:contact@vidyadigitalstudio.com",
    newTab: true,
  },
};

const BusinessCard = () => {
  const phoneNumber = "7096413502"; // without country code
  const message = "Hello! I'm interested in your services.";

  const whatsappLink = `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(
    message,
  )}`;

  useEffect(() => {
    const init = async () => {
      let deviceId = localStorage.getItem("deviceId");

      if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem("deviceId", deviceId);
      }

      try {
        await logScan({
          deviceId,
          label: "vidya-digital-studio-page",
        });
      } catch (e) {
        console.error("Scan logging failed:", e);
      }
    };

    init();
  }, []);

  const open = useCallback((url, newTab = false) => {
    if (newTab) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = url;
    }
  }, []);

  const downloadVCard = () => {
    const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:Vidya Digital Studio
ORG:Vidya Digital Studio
TITLE:Creative & Digital Studio
TEL;TYPE=WORK,VOICE:+917096413502
EMAIL:contact@vidyadigitalstudio.com
URL:https://www.vidyadigitalstudio.com
ADR;TYPE=WORK:;;India;;;; 
END:VCARD`;

    const blob = new Blob([vCardData], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "Vidya-Digital-Studio.vcf";
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.masterContainer}>
      <div className={styles.card}>
        {/* LOGO */}
        <div className={styles.logoWrapper}>
          <img
            src={Images.Circle_logo}
            alt="Vidya Digital Studio Logo"
            className={styles.logo}
            loading="lazy"
          />
        </div>

        {/* TITLE */}
        <h1 className={styles.title}>Vidya Digital Studio</h1>

        <p className={styles.description}>
          All-in-one Creative & Digital Studio for Marketing, Design, Web, and
          3D experiences.
        </p>

        {/* PRIMARY CTA */}
        <button
          className={styles.primaryBtn}
          onClick={() => open(LINKS.contact.url, LINKS.contact.newTab)}
        >
          🚀 Start Your Project
        </button>

        {/* SECONDARY BUTTONS */}
        <div className={styles.buttonGroup}>
          <button
            className={styles.secondaryBtn}
            onClick={() => open(LINKS.reel.url, LINKS.reel.newTab)}
          >
            ✨ Our Work in 60 Seconds
          </button>
          <button
            className={styles.secondaryBtn}
            onClick={() => open(LINKS.website.url, LINKS.website.newTab)}
          >
            🌐 Visit our Website
          </button>

          <button className={styles.secondaryBtn} onClick={downloadVCard}>
            📇 Save Contact
          </button>
        </div>
        {/* SOCIALS */}
        <div className={styles.socialRow}>
          <Icon
            icon="mdi:instagram"
            className={styles.socialIcon}
            aria-label="Instagram"
            onClick={() => open(LINKS.instagram.url, LINKS.instagram.newTab)}
          />
          <Icon
            icon="mdi:facebook"
            className={styles.socialIcon}
            aria-label="Facebook"
            onClick={() => open(LINKS.facebook.url, LINKS.facebook.newTab)}
          />
          <Icon
            icon="material-symbols:mail-outline"
            className={styles.socialIcon}
            aria-label="Email"
            onClick={() => open(LINKS.email.url, LINKS.email.newTab)}
          />
          <Icon
            icon="ic:baseline-whatsapp"
            className={styles.socialIcon}
            aria-label="WhatsApp"
            onClick={() => open(whatsappLink, true)}
          />
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
