import React, { useEffect, useState } from "react";
import Loader from "../../components/Loader/Loader";
import styles from "./ClientDocuments.module.css";
import { FiFile, FiDownloadCloud, FiExternalLink } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { getClientByIdAPI } from "../../api/clients.api";

const ClientDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id: clientId } = useParams();

  useEffect(() => {
    if (clientId) fetchDocuments();
  }, [clientId]);

  const fetchDocuments = async () => {
    try {
      const res = await getClientByIdAPI(clientId);
      setDocuments(res.data.data.documents || []);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "Unknown size";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) return <Loader />;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Documents</h1>
        <p className={styles.subtitle}>Access all files and deliverables shared with you.</p>
      </div>

      {documents.length > 0 ? (
        <div className={styles.docList}>
          {documents.map((doc, idx) => (
            <div key={idx} className={styles.docItem}>
              <div className={styles.docIcon}>
                <FiFile />
              </div>
              <div className={styles.docInfo}>
                <h4 className={styles.docName}>{doc.name}</h4>
                <p className={styles.docMeta}>
                  {formatSize(doc.size)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className={styles.docActions}>
                <a href={doc.url} target="_blank" rel="noreferrer" className={styles.actionBtn}>
                  <FiExternalLink /> View
                </a>
                <a href={doc.url} download className={`${styles.actionBtn} ${styles.primaryBtn}`}>
                  <FiDownloadCloud /> Download
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FiFile /></div>
          <h3>No documents yet</h3>
          <p>We haven't uploaded any files for you yet.</p>
        </div>
      )}
    </div>
  );
};

export default ClientDocuments;
