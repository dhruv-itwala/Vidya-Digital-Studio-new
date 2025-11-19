import styles from "./Footer.module.css";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaPinterestP,
} from "react-icons/fa";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { BsTwitterX } from "react-icons/bs";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Images } from "../../assets/Data/images";

const Footer = () => {
  return (
    <div className={styles.container}>
      <motion.footer
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className={styles.footer}
      >
        <div className={styles.grid}>
          {/* COLUMN 1 — BRAND */}
          <div className={styles.brand}>
            <img
              src={Images.navbar_logo}
              alt="logo"
              height={55}
              className={styles.logo}
            />

            <p className={styles.tagline}>
              We’re a design-driven agency helping startups and brands with
              intuitive digital experiences, bold visuals, and effective
              storytelling.
            </p>

            <Link to="/contact-us" className={styles.ctaBtn}>
              Contact us
            </Link>
          </div>

          {/* COLUMN 2 — SERVICES */}
          <div className={styles.column}>
            <h4>Services</h4>
            <ul>
              <li>Content Solutions</li>
              <li>Graphic & UI/UX Design</li>
              <li>Web & App Development</li>
              <li>2D/3D Animation</li>
            </ul>
          </div>

          {/* COLUMN 3 — PORTFOLIO */}
          <div className={styles.column}>
            <h4>Portfolio</h4>
            <ul>
              <li>Video Editing Portfolio</li>
              <li>2D/3D Animation Portfolio</li>
              <li>Social Media Marketing Portfolio</li>
              <li>Graphic & UI/UX Portfolio</li>
              <li>Web & App Portfolio</li>
            </ul>
          </div>

          {/* COLUMN 4 — GET IN TOUCH */}
          <div className={styles.column}>
            <h4>Get in Touch</h4>
            <ul className={styles.contactList}>
              <li>
                <FiPhone /> +91 7096413502
              </li>
              <li>
                <FiMail /> contact@vidyadigitalstudio.com
              </li>
              <li>
                <FiMapPin /> Vadodara, Gujarat, India
              </li>
            </ul>

            <h4 className={styles.followTitle}>Follow us</h4>
            <div className={styles.socials}>
              <FaLinkedinIn onClick={() => window.open("#")} />
              <FaInstagram onClick={() => window.open("#")} />
              <FaFacebookF onClick={() => window.open("#")} />
              <FaYoutube onClick={() => window.open("#")} />
              <BsTwitterX onClick={() => window.open("#")} />
              <FaPinterestP onClick={() => window.open("#")} />
            </div>
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.bottom}>
          <p>© 2025 Vidya Writing Studio</p>

          <div className={styles.legal}>
            <Link to="/terms-and-conditions">Terms & Conditions</Link>
            <span>│</span>
            <Link to="/privacy-policy">Privacy Policy</Link>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default Footer;
