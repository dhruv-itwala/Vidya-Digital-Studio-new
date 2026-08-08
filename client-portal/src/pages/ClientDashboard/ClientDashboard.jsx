import React, { useEffect, useState } from "react";
import clientApi from "../../api/clientAxios";
import { FaGoogleDrive, FaCalendarAlt, FaCheckCircle } from "react-icons/fa";
import styles from "./ClientDashboard.module.css";
import { FiStar, FiChevronRight } from "react-icons/fi";

const getEmbedUrl = (url) => {
  if (!url) return null;
  if (url.includes("spreadsheets/d/")) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return `https://docs.google.com/spreadsheets/d/${match[1]}/htmlembed?widget=true&chrome=false`;
    }
  }
  return url;
};

const ClientDashboard = () => {
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await clientApi.get("/client-portal/me");
      setClientData(res.data.data);
    } catch (error) {
      console.error("Failed to fetch client data", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!clientData) return <div className={styles.errorText}>Failed to load data.</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Welcome back, {clientData.clientName}
        </h1>
        <p className={styles.subtitle}>Overview of your active plans, deliverables, and workspace links.</p>
      </div>

      <div className={styles.dashboardGrid}>
        {/* Plan Details & Deliverables */}
        <div className={styles.dashboardCard}>
          <h2 className={styles.sectionTitle}>
            <FiStar style={{ color: '#10b981' }} /> Plan & Deliverables
          </h2>

          <div className={styles.planBox}>
            {clientData.planDetails || "No plan details provided yet."}
          </div>

          <h3 className={styles.subTitle} style={{ marginBottom: '1rem', fontWeight: 600, color: '#111827' }}>
            Deliverables Target
          </h3>
          {clientData.deliverables?.length > 0 ? (
            <div className={styles.deliverablesGrid}>
              {clientData.deliverables.map((item, idx) => (
                <div key={idx} className={styles.deliverableItem}>
                  <div className={styles.deliverableIcon}>
                    <FaCheckCircle />
                  </div>
                  <span className={styles.deliverableText}>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No specific deliverables listed.</p>
          )}
        </div>

        {/* Sidebar Area for Workspace Links */}
        <div className={styles.sidebarStack}>
          {/* Quick Links */}
          <div className={styles.dashboardCard}>
            <h2 className={styles.sectionTitle}>
              Workspace Links
            </h2>
            <div className={styles.linkList}>
              <a
                href={clientData.contentCalendarLink || "#"}
                target={clientData.contentCalendarLink ? "_blank" : "_self"}
                rel="noreferrer"
                className={`${styles.linkItem} ${!clientData.contentCalendarLink ? styles.disabled : ''}`}
              >
                <div className={styles.linkLeft}>
                  <div className={`${styles.linkIcon} ${styles.blue}`}>
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <h4 className={styles.linkTitle}>Content Calendar</h4>
                    <p className={styles.linkSub}>View schedule</p>
                  </div>
                </div>
                <FiChevronRight style={{ color: '#9ca3af' }} />
              </a>

              <a
                href={clientData.driveFolderLink || "#"}
                target={clientData.driveFolderLink ? "_blank" : "_self"}
                rel="noreferrer"
                className={`${styles.linkItem} ${!clientData.driveFolderLink ? styles.disabled : ''}`}
              >
                <div className={styles.linkLeft}>
                  <div className={`${styles.linkIcon} ${styles.emerald}`}>
                    <FaGoogleDrive />
                  </div>
                  <div>
                    <h4 className={styles.linkTitle}>Google Drive</h4>
                    <p className={styles.linkSub}>Access files</p>
                  </div>
                </div>
                <FiChevronRight style={{ color: '#9ca3af' }} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Calendar Section */}
      {clientData.contentCalendarLink && (
        <div className={styles.dashboardCard} style={{ marginTop: '1.5rem' }}>
          <h2 className={styles.sectionTitle}>
            <FaCalendarAlt style={{ color: '#3b82f6' }} /> Live Content Calendar
          </h2>
          <div className={styles.iframeWrapper}>
            <iframe
              src={getEmbedUrl(clientData.contentCalendarLink)}
              title="Content Calendar"
              width="100%"
              height="100%"
              frameBorder="0"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
