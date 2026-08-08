import React, { useEffect, useState } from "react";
import Loader from "../../components/Loader/Loader";
import styles from "./ClientAssets.module.css";
import { FiKey, FiCopy, FiCheck, FiExternalLink } from "react-icons/fi";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { getClientByIdAPI } from "../../api/clients.api";

const ClientAssets = () => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const { id: clientId } = useParams();

  useEffect(() => {
    if (clientId) fetchCredentials();
  }, [clientId]);

  const fetchCredentials = async () => {
    try {
      const res = await getClientByIdAPI(clientId);
      setCredentials(res.data.data.credentials || []);
    } catch (error) {
      console.error("Failed to fetch credentials", error);
      toast.error("Could not load assets.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Password copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <Loader />;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Assets & Logins</h1>
        <p className={styles.subtitle}>Secure access to your saved platforms and tools.</p>
      </div>

      {credentials.length > 0 ? (
        <div className={styles.grid}>
          {credentials.map((cred) => (
            <div key={cred._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                  <FiKey />
                </div>
                <h3 className={styles.platform}>{cred.platform}</h3>
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.field}>
                  <span className={styles.label}>Username</span>
                  <p className={styles.value}>{cred.username || "—"}</p>
                </div>
                
                <div className={styles.field}>
                  <span className={styles.label}>Password</span>
                  <div className={styles.passwordWrapper}>
                    <input 
                      type="password" 
                      value={cred.password || ""} 
                      readOnly 
                      className={styles.passwordInput}
                    />
                    <button 
                      className={styles.copyBtn}
                      onClick={() => copyToClipboard(cred.password, cred._id)}
                      disabled={!cred.password}
                      title="Copy Password"
                    >
                      {copiedId === cred._id ? <FiCheck className={styles.successIcon} /> : <FiCopy />}
                    </button>
                  </div>
                </div>

                {cred.note && (
                  <div className={styles.field}>
                    <span className={styles.label}>Note</span>
                    <p className={styles.noteText}>{cred.note}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FiKey /></div>
          <h3>No assets found</h3>
          <p>We haven't saved any logins or assets for you yet.</p>
        </div>
      )}
    </div>
  );
};

export default ClientAssets;
