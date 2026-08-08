import React, { useEffect, useState } from "react";
import clientApi from "../../api/clientAxios";
import styles from "./ClientDocuments.module.css";
import { FiFile, FiDownloadCloud, FiExternalLink } from "react-icons/fi";

const ClientDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await clientApi.get("/client-portal/me");
      setDocuments(res.data.data.documents || []);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Documents</h1>
        <p className={styles.subtitle}>Access all your deliverables and files here.</p>
      </div>

      {documents.length > 0 ? (
        <div className={styles.documentList}>
          {documents.map((doc) => (
            <div key={doc.public_id} className={styles.documentItem}>
              <div className={styles.docLeft}>
                <div className={styles.docIcon}>
                  <FiFile />
                </div>
                <div className={styles.docInfo}>
                  <h4 className={styles.docName}>{doc.name}</h4>
                  <span className={styles.docMeta}>
                    {doc.type} • {formatBytes(doc.size)}
                  </span>
                </div>
              </div>
              <div className={styles.docActions}>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className={styles.actionBtn} title="View Document">
                  <FiExternalLink />
                </a>
                <a href={doc.url} download className={styles.actionBtn} title="Download">
                  <FiDownloadCloud />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FiFile /></div>
          <h3>No documents available</h3>
          <p>Deliverables will appear here once uploaded by our team.</p>
        </div>
      )}
    </div>
  );
};

export default ClientDocuments;
