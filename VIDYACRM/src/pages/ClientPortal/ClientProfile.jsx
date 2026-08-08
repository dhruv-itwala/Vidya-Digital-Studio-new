import React, { useEffect, useState } from "react";
import Loader from "../../components/Loader/Loader";
import styles from "./ClientProfile.module.css";
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiBox } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { getClientByIdAPI } from "../../api/clients.api";

const ClientProfile = () => {
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id: clientId } = useParams();

  useEffect(() => {
    if (clientId) fetchProfile();
  }, [clientId]);

  const fetchProfile = async () => {
    try {
      const res = await getClientByIdAPI(clientId);
      setClientData(res.data.data);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!clientData) return <div className={styles.error}>Failed to load profile.</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Profile</h1>
        <p className={styles.subtitle}>Manage your account details and services.</p>
      </div>

      <div className={styles.card}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {clientData.profilePhoto?.url ? (
              <img src={clientData.profilePhoto.url} alt="Profile" />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <FiUser />
              </div>
            )}
          </div>
          <div className={styles.headerInfo}>
            <h2 className={styles.clientName}>{clientData.clientName}</h2>
            {clientData.ownerName && <p className={styles.ownerName}>Owner: {clientData.ownerName}</p>}
            <span className={styles.statusBadge}>Active</span>
          </div>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.iconWrapper}><FiMail /></div>
            <div>
              <span className={styles.label}>Email Address</span>
              <p className={styles.value}>{clientData.email || "N/A"}</p>
            </div>
          </div>
          
          <div className={styles.infoItem}>
            <div className={styles.iconWrapper}><FiPhone /></div>
            <div>
              <span className={styles.label}>Phone Number</span>
              <p className={styles.value}>{clientData.phone || "N/A"}</p>
            </div>
          </div>

          <div className={styles.infoItem}>
            <div className={styles.iconWrapper}><FiMapPin /></div>
            <div>
              <span className={styles.label}>Address</span>
              <p className={styles.value}>{clientData.address || "N/A"}</p>
            </div>
          </div>

          <div className={styles.infoItem}>
            <div className={styles.iconWrapper}><FiCalendar /></div>
            <div>
              <span className={styles.label}>Onboarding Date</span>
              <p className={styles.value}>
                {clientData.onboardingDate 
                  ? new Date(clientData.onboardingDate).toLocaleDateString() 
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.servicesSection}>
          <h3 className={styles.sectionTitle}><FiBox style={{ marginRight: '0.5rem' }}/> Services Enrolled</h3>
          <div className={styles.servicesList}>
            {clientData.services?.length > 0 ? (
              clientData.services.map((service, idx) => (
                <span key={idx} className={styles.serviceBadge}>{service}</span>
              ))
            ) : (
              <p className={styles.emptyText}>No services listed.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
