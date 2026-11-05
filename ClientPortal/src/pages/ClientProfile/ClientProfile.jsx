import React, { useEffect, useState } from "react";
import clientApi from "../../api/clientAxios";
import { motion } from "framer-motion";
import styles from "./ClientProfile.module.css";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiBox,
  FiShield,
  FiClock,
  FiMessageSquare,
  FiCheck,
  FiCopy,
  FiExternalLink,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function ClientProfile() {
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await clientApi.get("/client-portal/me");
      setClientData(res.data.data);
    } catch (error) {
      console.error("[ClientProfile] Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${key}!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.loadingCard}
        >
          <span className="spin" style={{ fontSize: "1.4rem", color: "#059669" }}>⟳</span>
          <span style={{ fontWeight: 600, color: "#334155" }}>Loading Profile...</span>
        </motion.div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorCard}>Failed to load profile.</div>
      </div>
    );
  }

  const companyName = clientData.clientName || clientData.companyName || "Client Account";
  const avatarUrl = clientData.profilePhoto?.url || "";
  const services = clientData.services || [
    "Reels Filming & Editing",
    "Social Media Strategy",
    "Content Calendar Management",
    "Graphic Design & Carousels",
    "Caption Copywriting & Hashtags",
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={styles.pageContainer}
    >
      <motion.div variants={itemVariants} className={styles.header}>
        <h1 className={styles.title}>Client Profile &amp; Account</h1>
        <p className={styles.subtitle}>
          Official contract coordinates, enrolled studio services, and executive account support.
        </p>
      </motion.div>

      <div className={styles.grid}>
        {/* Left Column: Account Details & Identity */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className={styles.card}
        >
          <div className={styles.identityHeader}>
            <div className={styles.avatarWrap}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={companyName} className={styles.avatarImg} />
              ) : (
                <span>{companyName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className={styles.identityMeta}>
              <div className={styles.clientCompanyName}>{companyName}</div>
              <div className={styles.clientOwnerName}>
                Authorized Rep: {clientData.ownerName || "Primary Stakeholder"}
              </div>
              <div className={styles.statusPill}>
                <span className={styles.statusDot} />
                <span>Active Retainer Plan</span>
              </div>
            </div>
          </div>

          <div className={styles.sectionTitle}>
            <FiShield className={styles.sectionIcon} />
            <span>Contact &amp; Billing Coordinates</span>
          </div>

          <div className={styles.detailsList}>
            {/* Email */}
            <div className={styles.detailRow}>
              <div className={styles.iconCircle}>
                <FiMail />
              </div>
              <div className={styles.detailContent}>
                <div className={styles.detailLabel}>Email Address</div>
                <div className={styles.detailValue}>{clientData.email || "N/A"}</div>
              </div>
              {clientData.email && (
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  onClick={() => copyToClipboard(clientData.email, "Email")}
                  className={styles.copyBtn}
                  title="Copy email"
                >
                  {copiedKey === "Email" ? <FiCheck color="#059669" size={13} /> : <FiCopy size={13} />}
                </motion.button>
              )}
            </div>

            {/* Phone */}
            <div className={styles.detailRow}>
              <div className={styles.iconCircle}>
                <FiPhone />
              </div>
              <div className={styles.detailContent}>
                <div className={styles.detailLabel}>Phone Number</div>
                <div className={styles.detailValue}>{clientData.phone || "N/A"}</div>
              </div>
              {clientData.phone && (
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  onClick={() => copyToClipboard(clientData.phone, "Phone")}
                  className={styles.copyBtn}
                  title="Copy phone"
                >
                  {copiedKey === "Phone" ? <FiCheck color="#059669" size={13} /> : <FiCopy size={13} />}
                </motion.button>
              )}
            </div>

            {/* Address */}
            <div className={styles.detailRow}>
              <div className={styles.iconCircle}>
                <FiMapPin />
              </div>
              <div className={styles.detailContent}>
                <div className={styles.detailLabel}>Official Billing Address</div>
                <div className={styles.detailValue}>{clientData.address || "On File with Studio"}</div>
              </div>
            </div>

            {/* Onboarding Date */}
            <div className={styles.detailRow}>
              <div className={styles.iconCircle}>
                <FiCalendar />
              </div>
              <div className={styles.detailContent}>
                <div className={styles.detailLabel}>Client Onboarding Date</div>
                <div className={styles.detailValue}>
                  {clientData.onboardingDate
                    ? new Date(clientData.onboardingDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Active Retainer"}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Enrolled Services & Dedicated Studio Support */}
        <div className={styles.rightCol}>
          {/* Services Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className={styles.card}
          >
            <div className={styles.sectionTitle}>
              <FiBox className={styles.sectionIcon} />
              <span>Enrolled Studio Services</span>
            </div>

            <div className={styles.servicesGrid}>
              {services.map((service, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={styles.serviceTag}
                >
                  <FiBox className={styles.serviceIcon} />
                  <span>{service}</span>
                </motion.div>
              ))}
            </div>

            {clientData.planDetails && (
              <div className={styles.scopeBox}>
                <div className={styles.scopeLabel}>Retainer Scope Note</div>
                <p className={styles.scopeText}>{clientData.planDetails}</p>
              </div>
            )}
          </motion.div>

          {/* Dedicated Studio Support Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className={styles.supportCard}
          >
            <div className={styles.supportHeader}>
              <div className={styles.supportIconWrap}>
                <FaWhatsapp />
              </div>
              <div>
                <div className={styles.supportTitle}>Dedicated Studio Support</div>
                <div className={styles.supportSub}>Direct Account Executive &amp; Director Hotline</div>
              </div>
            </div>
            <p className={styles.supportText}>
              Need immediate revisions, emergency posting requests, or scope expansions? Your account manager and creative director are directly available.
            </p>
            <div className={styles.supportBtnRow}>
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="https://wa.me/919427507758"
                target="_blank"
                rel="noreferrer"
                className={`${styles.supportBtn} ${styles.supportBtnWhatsapp}`}
              >
                <FaWhatsapp size={15} />
                <span>WhatsApp Studio</span>
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="mailto:contact@vidyadigitalstudio.com"
                className={`${styles.supportBtn} ${styles.supportBtnEmail}`}
              >
                <FiMail size={15} />
                <span>Email Team</span>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
