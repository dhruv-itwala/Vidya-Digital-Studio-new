import React, { useEffect, useState } from "react";
import clientApi from "../../api/clientAxios";
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
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";

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
      <div style={{ padding: "3rem", textAlign: "center", color: "#0f5c44", fontWeight: 700 }}>
        Loading Profile...
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ color: "#dc2626", fontWeight: 600 }}>Failed to load profile.</div>
      </div>
    );
  }

  const companyName = clientData.clientName || clientData.companyName || "Client Account";
  const avatarUrl = clientData.profilePhoto?.url || "";
  const services = clientData.services || [
    "Reels Production",
    "Social Media Management",
    "Content Calendar",
    "Graphic Design & Carousels",
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Client Profile</h1>
        <p className={styles.subtitle}>
          Official contract details, enrolled services, and account executive support.
        </p>
      </div>

      <div className={styles.grid}>
        {/* Left Column: Account Details & Identity */}
        <div className={styles.card}>
          <div className={styles.identityHeader}>
            <div className={styles.avatarWrap}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={companyName} />
              ) : (
                companyName.charAt(0).toUpperCase()
              )}
            </div>
            <div className={styles.identityMeta}>
              <div className={styles.clientCompanyName}>{companyName}</div>
              <div className={styles.clientOwnerName}>
                Owner / Authorized Rep: {clientData.ownerName || "Primary Stakeholder"}
              </div>
              <div className={styles.statusPill}>
                <span className={styles.statusDot} />
                Active Retainer
              </div>
            </div>
          </div>

          <div className={styles.sectionTitle}>
            <FiShield color="#0f5c44" />
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
                <button
                  type="button"
                  onClick={() => copyToClipboard(clientData.email, "Email")}
                  style={{ color: "#64748b", padding: "4px" }}
                  title="Copy email"
                >
                  {copiedKey === "Email" ? <FiCheck color="#059669" /> : <FiCopy />}
                </button>
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
                <button
                  type="button"
                  onClick={() => copyToClipboard(clientData.phone, "Phone")}
                  style={{ color: "#64748b", padding: "4px" }}
                  title="Copy phone"
                >
                  {copiedKey === "Phone" ? <FiCheck color="#059669" /> : <FiCopy />}
                </button>
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
        </div>

        {/* Right Column: Enrolled Services & Dedicated Studio Support */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Services Card */}
          <div className={styles.card}>
            <div className={styles.sectionTitle}>
              <FiBox color="#0f5c44" />
              <span>Enrolled Studio Services</span>
            </div>

            <div className={styles.servicesGrid}>
              {services.map((service, idx) => (
                <div key={idx} className={styles.serviceTag}>
                  <FiBox className={styles.serviceIcon} />
                  <span>{service}</span>
                </div>
              ))}
            </div>

            {clientData.planDetails && (
              <div style={{ marginTop: "8px", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Retainer Scope Note
                </div>
                <p style={{ fontSize: "0.82rem", color: "#334155", marginTop: "4px" }}>
                  {clientData.planDetails}
                </p>
              </div>
            )}
          </div>

          {/* Dedicated Studio Support Card */}
          <div className={styles.supportCard}>
            <div className={styles.supportTitle}>Dedicated Studio Support</div>
            <p className={styles.supportText}>
              Need immediate assistance, emergency posting requests, or scope expansions? Your account manager and creative director are directly available.
            </p>
            <div className={styles.supportBtnRow}>
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noreferrer"
                className={`${styles.supportBtn} ${styles.supportBtnPrimary}`}
              >
                <FaWhatsapp size={15} /> WhatsApp Studio
              </a>
              <a
                href="mailto:contact@vidyadigitalstudio.com"
                className={styles.supportBtn}
                style={{ background: "#ffffff", border: "1px solid #a7f3d0", color: "#065f46" }}
              >
                <FiMail size={15} /> Email Team
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
