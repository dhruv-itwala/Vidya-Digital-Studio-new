import React from "react";
import styles from "./Footer.module.css";
import { footerMedia } from "../../assets/Data/MasterData";
import {
  FaLinkedinIn,
  FaInstagram,
  FaFacebookF,
  FaBehance,
  FaXTwitter,
  FaPinterestP,
  FaYoutube,
  FaEnvelope,
} from "react-icons/fa6";

import { FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className={styles.footerWrapper}>
      <div
        className={`masterContainer ${styles.footerGrid}`}
        style={{ alignItems: "flex-start" }}
      >
        {/* LEFT – BRAND */}
        <div className={styles.brand}>
          <img
            src={footerMedia.footer_Logo}
            alt="Vidya Digital Studio"
            className={styles.logo}
          />
          <p>
            We’re a design-driven agency helping startups and brands with
            intuitive digital experiences, bold visuals, and effective
            storytelling.
          </p>

          <button className={styles.cta}>Get in touch</button>
        </div>

        {/* SERVICES */}
        <div className={styles.column}>
          <h4>Services</h4>
          <ul>
            <li>Content Solutions</li>
            <li>Graphic & UI/UX Design</li>
            <li>Web & App Development</li>
            <li>2D / 3D Animation</li>
          </ul>
        </div>

        {/* PORTFOLIO */}
        <div className={styles.column}>
          <h4>Portfolio</h4>
          <ul>
            <li>Video Editing Portfolio</li>
            <li>2D / 3D Animation Portfolio</li>
            <li>Social Media Marketing Portfolio</li>
            <li>Graphic & UI/UX Portfolio</li>
            <li>Web & App Portfolio</li>
          </ul>
        </div>

        {/* CONTACT */}
        <div className={styles.column}>
          <h4>Get in Touch</h4>
          <ul className={styles.contactList}>
            <li>
              <FaPhoneAlt /> +91 7096413502
            </li>
            <li>
              <FaEnvelope /> contact@vidyawritingstudio.com
            </li>
            <li>
              <FaMapMarkerAlt /> Vadodara, Gujarat, India
            </li>
          </ul>

          <h5 className={styles.followTitle}>Follow us</h5>
          <div className={styles.socials}>
            <FaLinkedinIn />
            <FaInstagram />
            <FaFacebookF />
            <FaBehance />
            <FaXTwitter />
            <FaPinterestP />
            <FaYoutube />
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className={styles.bottomBar}>
        <div className="masterContainer">
          <span>© 2025 Vidya Writing Studio</span>
          <div className={styles.legal}>
            <a href="/terms">Terms & Conditions</a>
            <span>|</span>
            <a href="/privacy-policy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
