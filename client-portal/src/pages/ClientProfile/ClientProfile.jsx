import React, { useEffect, useState } from "react";
import clientApi from "../../api/clientAxios";
import styles from "./ClientProfile.module.css";
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiBox } from "react-icons/fi";

const ClientProfile = () => {
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await clientApi.get("/client-portal/me");
      setClientData(res.data.data);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!clientData) return <div className={styles.errorText}>No profile found.</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Profile</h1>
        <p className={styles.subtitle}>View your account details and associated services.</p>
      </div>

      <div className={styles.contentGrid}>
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
            <div>
              <h2 className={styles.companyName}>{clientData.companyName || clientData.clientName}</h2>
              <p className={styles.ownerName}>{clientData.ownerName}</p>
            </div>
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}><FiMail /></div>
              <div>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{clientData.email || "N/A"}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}><FiPhone /></div>
              <div>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>{clientData.phone || "N/A"}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}><FiMapPin /></div>
              <div>
                <span className={styles.infoLabel}>Address</span>
                <span className={styles.infoValue}>{clientData.address || "N/A"}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}><FiCalendar /></div>
              <div>
                <span className={styles.infoLabel}>Onboarding Date</span>
                <span className={styles.infoValue}>
                  {clientData.onboardingDate ? new Date(clientData.onboardingDate).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Enrolled Services</h2>
          {clientData.services?.length > 0 ? (
            <div className={styles.servicesGrid}>
              {clientData.services.map((service, idx) => (
                <div key={idx} className={styles.serviceTag}>
                  <FiBox className={styles.serviceIcon} />
                  {service}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No services enrolled yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
