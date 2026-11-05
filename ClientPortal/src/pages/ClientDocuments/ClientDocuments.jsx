import React, { useEffect, useState, useMemo } from "react";
import clientApi from "../../api/clientAxios";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ClientDocuments.module.css";
import {
  FiFile,
  FiFileText,
  FiDownloadCloud,
  FiExternalLink,
  FiFolder,
  FiSearch,
  FiFilter,
} from "react-icons/fi";

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

export default function ClientDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await clientApi.get("/client-portal/me");
      setDocuments(res.data.data?.documents || []);
    } catch (error) {
      console.error("[ClientDocuments] Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes, decimals = 1) => {
    if (!+bytes) return "Unknown size";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const filteredDocs = useMemo(() => {
    if (selectedCategory === "all") return documents;
    return documents.filter((doc) => {
      const name = (doc.name || "").toLowerCase();
      const type = (doc.type || "").toLowerCase();
      if (selectedCategory === "contracts") {
        return name.includes("agreement") || name.includes("contract") || name.includes("sow");
      }
      if (selectedCategory === "deliverables") {
        return name.includes("deliverable") || name.includes("export") || type.includes("video") || type.includes("image");
      }
      if (selectedCategory === "briefs") {
        return name.includes("brief") || name.includes("guide") || name.includes("brand");
      }
      return true;
    });
  }, [documents, selectedCategory]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.loadingCard}
        >
          <span className="spin" style={{ fontSize: "1.4rem", color: "#059669" }}>⟳</span>
          <span style={{ fontWeight: 600, color: "#334155" }}>Loading Documents...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={styles.pageContainer}
    >
      {/* ================= HEADER ================= */}
      <motion.div variants={itemVariants} className={styles.header}>
        <div>
          <h1 className={styles.title}>Documents &amp; Deliverables</h1>
          <p className={styles.subtitle}>
            Contracts, scopes of work, creative guidelines, and final high-res project files.
          </p>
        </div>
      </motion.div>

      {/* ================= FILTER BAR ================= */}
      <motion.div variants={itemVariants} className={styles.filterBar}>
        {[
          { key: "all", label: "All Documents" },
          { key: "contracts", label: "Contracts & SOWs" },
          { key: "briefs", label: "Creative Briefs & Guides" },
          { key: "deliverables", label: "Final Deliverables" },
        ].map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`${styles.filterBtn} ${selectedCategory === cat.key ? styles.filterBtnActive : ""}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {selectedCategory === cat.key && (
              <motion.div
                layoutId="docCategoryActivePill"
                className={styles.filterBtnActiveBg}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className={styles.filterBtnLabel}>{cat.label}</span>
          </button>
        ))}
      </motion.div>

      {/* ================= DOCUMENTS GRID ================= */}
      {filteredDocs.length > 0 ? (
        <motion.div variants={itemVariants} className={styles.documentsGrid}>
          {filteredDocs.map((doc, idx) => {
            const ext = (doc.name || "").split(".").pop()?.toUpperCase() || doc.type || "FILE";
            const downloadUrl = doc.url?.includes("/upload/")
              ? doc.url.replace("/upload/", "/upload/fl_attachment/")
              : doc.url;

            return (
              <motion.div
                key={doc.public_id || idx}
                layout="position"
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className={styles.docCard}
              >
                <div className={styles.docCardTop}>
                  <div className={styles.docIconWrap}>
                    <FiFileText />
                  </div>
                  <div className={styles.docMetaBlock}>
                    <div className={styles.docName} title={doc.name}>{doc.name}</div>
                    <div className={styles.docSubDetails}>
                      <span className={styles.fileTypeBadge}>{ext}</span>
                      <span>{formatBytes(doc.size)}</span>
                      {doc.uploadedAt && (
                        <span>
                          • {new Date(doc.uploadedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.docCardActions}>
                  <motion.a
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.actionBtn} ${styles.viewBtn}`}
                    title="View Document in New Tab"
                  >
                    <FiExternalLink size={13} />
                    <span>View</span>
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    href={downloadUrl}
                    download={doc.name}
                    className={`${styles.actionBtn} ${styles.downloadBtn}`}
                    title="Download File"
                  >
                    <FiDownloadCloud size={13} />
                    <span>Download</span>
                  </motion.a>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FiFolder />
          </div>
          <h3 className={styles.emptyTitle}>No Documents Found</h3>
          <p className={styles.emptyDesc}>
            {selectedCategory === "all"
              ? "All signed master contracts, briefs, and deliverables will appear here once uploaded by the studio."
              : `No files found in the "${selectedCategory}" category.`}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
