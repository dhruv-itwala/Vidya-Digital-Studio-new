import React, { useEffect, useState } from "react";
import clientApi from "../../api/clientAxios";
import Loader from "../Loader/Loader";
import { FaFileInvoiceDollar, FaGoogleDrive, FaCalendarAlt, FaCheckCircle, FaSignOutAlt, FaExternalLinkAlt } from "react-icons/fa";
import styles from "./ClientDashboard.module.css";
import { FiClock, FiStar, FiChevronRight } from "react-icons/fi";

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

  const handleLogout = () => {
    localStorage.removeItem("clientToken");
    localStorage.removeItem("clientData");
    window.location.href = "/client-login";
  };

  if (loading) return <Loader />;
  if (!clientData) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Failed to load data.</div>;

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardWrapper}>

        {/* Header */}
        <div className={styles.dashboardHeader}>
          <div>
            <h1 className={styles.mainTitle}>
              Welcome back, {clientData.clientName}
            </h1>
            <p className={styles.subTitle}>Manage your project deliverables, invoices, and calendars.</p>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <FaSignOutAlt /> Sign Out
          </button>
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

          {/* Sidebar Area */}
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

            {/* Recent Invoices */}
            <div className={styles.dashboardCard}>
              <h2 className={styles.sectionTitle}>
                <FaFileInvoiceDollar style={{ color: '#8b5cf6' }} /> Invoices
              </h2>
              {clientData.invoices?.length > 0 ? (
                <div className={styles.invoiceList}>
                  {clientData.invoices.map((inv, idx) => (
                    <div key={idx} className={styles.invoiceItem}>
                      <div>
                        <p className={styles.invoiceTitle}>{inv.title}</p>
                        <p className={styles.invoiceDate}>
                          <FiClock /> {new Date(inv.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <a href={inv.url} target="_blank" rel="noreferrer" className={styles.viewBtn}>
                        View
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyText}>No invoices available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Embedded Calendar Section */}
        {clientData.contentCalendarLink && (
          <div className={styles.dashboardCard}>
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
    </div>
  );
};

export default ClientDashboard;
