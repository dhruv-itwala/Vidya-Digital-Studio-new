import React, { useEffect, useState } from "react";
import clientApi from "../../api/clientAxios";
import styles from "./ClientAssets.module.css";
import { FiKey, FiCopy, FiCheck, FiExternalLink } from "react-icons/fi";
import toast from "react-hot-toast";

const ClientAssets = () => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await clientApi.get("/client-portal/me/credentials");
      setCredentials(res.data.data);
    } catch (error) {
      console.error("Failed to fetch credentials", error);
      toast.error("Could not load assets.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Password copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Assets & Logins</h1>
        <p className={styles.subtitle}>Secure access to your platform credentials.</p>
      </div>

      {credentials.length > 0 ? (
        <div className={styles.grid}>
          {credentials.map((cred) => (
            <div key={cred._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.platformIcon}>
                  <FiExternalLink />
                </div>
                <h3 className={styles.platformName}>{cred.platform}</h3>
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.field}>
                  <span className={styles.label}>Username/Email</span>
                  <span className={styles.value}>{cred.username || "N/A"}</span>
                </div>
                
                <div className={styles.field}>
                  <span className={styles.label}>Password</span>
                  <div className={styles.passwordRow}>
                    <span className={styles.passwordMask}>••••••••</span>
                    <button 
                      onClick={() => copyToClipboard(cred.password, cred._id)}
                      className={styles.copyBtn}
                      title="Copy Password"
                    >
                      {copiedId === cred._id ? <FiCheck className={styles.copied} /> : <FiCopy />}
                    </button>
                  </div>
                </div>

                {cred.note && (
                  <div className={styles.noteField}>
                    <span className={styles.label}>Note:</span>
                    <p className={styles.note}>{cred.note}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FiKey /></div>
          <h3>No credentials saved</h3>
          <p>We haven't saved any login credentials for you yet.</p>
        </div>
      )}
    </div>
  );
};

export default ClientAssets;
