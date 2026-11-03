import React, { useEffect, useState, useMemo } from "react";
import clientApi from "../../api/clientAxios";
import styles from "./ClientDocuments.module.css";
import {
  FiFile,
  FiFileText,
  FiDownloadCloud,
  FiExternalLink,
  FiFolder,
  FiSearch,
} from "react-icons/fi";

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
      <div style={{ padding: "3rem", textAlign: "center", color: "#0f5c44", fontWeight: 700 }}>
        Loading Documents...
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* ================= HEADER ================= */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Documents &amp; Deliverables</h1>
          <p className={styles.subtitle}>
            Contracts, scopes of work, creative guidelines, and final high-res project files.
          </p>
        </div>
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className={styles.filterBar}>
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
            {cat.label}
          </button>
        ))}
      </div>

      {/* ================= DOCUMENTS GRID ================= */}
      {filteredDocs.length > 0 ? (
        <div className={styles.documentsGrid}>
          {filteredDocs.map((doc, idx) => {
            const ext = (doc.name || "").split(".").pop() || doc.type || "FILE";
            const downloadUrl = doc.url?.includes("/upload/")
              ? doc.url.replace("/upload/", "/upload/fl_attachment/")
              : doc.url;

            return (
              <div key={doc.public_id || idx} className={styles.docCard}>
                <div className={styles.docCardTop}>
                  <div className={styles.docIconWrap}>
                    <FiFileText />
                  </div>
                  <div className={styles.docMetaBlock}>
                    <div className={styles.docName}>{doc.name}</div>
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
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.actionBtn} ${styles.viewBtn}`}
                    title="View Document in New Tab"
                  >
                    <FiExternalLink size={13} /> View
                  </a>
                  <a
                    href={downloadUrl}
                    download={doc.name}
                    className={`${styles.actionBtn} ${styles.downloadBtn}`}
                    title="Download File"
                  >
                    <FiDownloadCloud size={13} /> Download
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FiFolder />
          </div>
          <h3>No Documents Found</h3>
          <p>
            {selectedCategory === "all"
              ? "All signed master contracts, briefs, and deliverables will appear here once uploaded by the studio."
              : `No files found in the "${selectedCategory}" category.`}
          </p>
        </div>
      )}
    </div>
  );
}
