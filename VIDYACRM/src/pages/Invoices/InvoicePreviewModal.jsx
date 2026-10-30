// VIDYACRM/src/pages/Invoices/InvoicePreviewModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  FiX,
  FiDownload,
  FiCheck,
  FiCopy,
  FiFileText,
  FiAlertCircle,
  FiExternalLink,
} from "react-icons/fi";
import styles from "./InvoicePreviewModal.module.css";
import toast from "react-hot-toast";

export default function InvoicePreviewModal({
  isOpen,
  status = "success", // 'loading' | 'success' | 'error'
  pdfUrl,
  pdfBase64,
  invoiceNumber,
  errorMessage,
  onClose,
}) {
  const [copied, setCopied] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");

  // Convert Base64 or Data URI to a true Blob URL for reliable inline rendering in browsers
  useEffect(() => {
    let createdUrl = null;

    if (pdfBase64) {
      try {
        const cleanB64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
        const byteCharacters = atob(cleanB64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      } catch (err) {
        console.error("[Invoice Preview] Error generating Blob URL from base64:", err);
      }
    } else if (pdfUrl && pdfUrl.startsWith("data:application/pdf;base64,")) {
      try {
        const raw = pdfUrl.replace(/^data:application\/pdf;base64,/, "");
        const byteCharacters = atob(raw);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      } catch (err) {
        console.error("[Invoice Preview] Error generating Blob URL from data URI:", err);
      }
    } else {
      setBlobUrl("");
    }

    return () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [pdfBase64, pdfUrl]);

  // Clean inline URL (ensure fl_attachment is stripped so browser renders inline instead of downloading)
  const displayUrl = useMemo(() => {
    if (blobUrl) return blobUrl;
    if (!pdfUrl) return "";
    // If Cloudinary URL, strip fl_attachment to allow embedding in iframe
    return pdfUrl.replace("/upload/fl_attachment/", "/upload/");
  }, [blobUrl, pdfUrl]);

  // Download URL (uses fl_attachment for Cloudinary or Blob for local)
  const downloadUrl = useMemo(() => {
    if (blobUrl) return blobUrl;
    if (!pdfUrl) return "";
    if (pdfUrl.includes("/upload/") && !pdfUrl.includes("/upload/fl_attachment/")) {
      return pdfUrl.replace("/upload/", "/upload/fl_attachment/");
    }
    return pdfUrl;
  }, [blobUrl, pdfUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const copyTarget = pdfUrl && !pdfUrl.startsWith("data:") ? pdfUrl : displayUrl;
    if (copyTarget) {
      navigator.clipboard.writeText(copyTarget);
      setCopied(true);
      toast.success("PDF link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (blobUrl) {
      const link = document.createElement("a");
      link.href = blobUrl;
      const safeName = (invoiceNumber || "Invoice").replace(/[^a-zA-Z0-9]/g, "_");
      link.download = `${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  const handleOpenNewTab = () => {
    if (displayUrl) {
      window.open(displayUrl, "_blank");
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.iconBadge}>
              <FiFileText size={16} />
            </div>
            <span className={styles.titleText}>
              {status === "loading" && "Composing Official Invoice..."}
              {status === "success" && `Invoice Ready (${invoiceNumber || "Document"})`}
              {status === "error" && "Generation Issue"}
            </span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className={styles.body}>
          {status === "loading" && (
            <div className={styles.stateBox}>
              <div className={styles.spinner}></div>
              <h4 className={styles.stateTitle}>Formatting 3-Page Official PDF</h4>
              <p className={styles.stateSubtitle}>
                Compiling service items, 18% GST calculation, 10 legal clauses, bank details, and payment QR code...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className={styles.stateBox}>
              <FiAlertCircle
                size={44}
                style={{ color: "var(--color-accent)", marginBottom: "16px" }}
              />
              <h4 className={styles.stateTitle}>Document Rendering Error</h4>
              <p className={styles.stateSubtitle}>
                {errorMessage || "An unexpected error occurred while rendering the PDF."}
              </p>
            </div>
          )}

          {status === "success" && (
            <div className={styles.previewLayout}>
              <div className={styles.metaStrip}>
                <div className={styles.metaRef}>
                  <span>Invoice Reference:</span>
                  <strong className={styles.refNum}>{invoiceNumber || "IND/2026"}</strong>
                </div>

                <div className={styles.metaButtons}>
                  {pdfUrl && !pdfUrl.startsWith("data:") && (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.btnOutline}`}
                      onClick={handleCopyLink}
                      title="Copy Public Link"
                    >
                      {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                      <span>{copied ? "Copied" : "Copy Link"}</span>
                    </button>
                  )}

                  {displayUrl && (
                    <button
                      type="button"
                      onClick={handleOpenNewTab}
                      className={`${styles.actionBtn} ${styles.btnOutline}`}
                      title="Open in new browser tab"
                    >
                      <FiExternalLink size={14} />
                      <span>Open Tab</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.btnPrimary}`}
                    onClick={handleDownload}
                    title="Download PDF to computer"
                  >
                    <FiDownload size={14} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* PDF Viewer with fallback object/iframe */}
              <div className={styles.frameWrapper}>
                {displayUrl ? (
                  <object
                    data={`${displayUrl}#view=FitH`}
                    type="application/pdf"
                    className={styles.iframe}
                  >
                    <iframe
                      src={`${displayUrl}#view=FitH`}
                      title="Invoice PDF Preview"
                      className={styles.iframe}
                    >
                      <div className={styles.fallbackNotice}>
                        <FiFileText size={36} color="var(--color-primary)" />
                        <h4 className={styles.fallbackTitle}>Preview Available</h4>
                        <p className={styles.fallbackSub}>
                          Your browser does not support embedded PDF rendering in this view.
                        </p>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.btnPrimary}`}
                          onClick={handleOpenNewTab}
                        >
                          <FiExternalLink size={14} />
                          <span>Open PDF Document</span>
                        </button>
                      </div>
                    </iframe>
                  </object>
                ) : (
                  <div className={styles.stateBox}>
                    <p>No PDF data available.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnOutline}`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
