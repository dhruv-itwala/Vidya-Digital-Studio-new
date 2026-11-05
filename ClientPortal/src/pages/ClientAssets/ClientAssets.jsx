import React, { useEffect, useState } from "react";
import clientApi from "../../api/clientAxios";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ClientAssets.module.css";
import {
  FiKey,
  FiCopy,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiShield,
  FiExternalLink,
  FiLayers,
  FiFolder,
  FiRefreshCw,
  FiPlus,
  FiTrash2,
  FiX,
  FiImage,
  FiCalendar,
  FiGlobe,
  FiLock,
} from "react-icons/fi";
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaGoogleDrive,
  FaLinkedin,
  FaTwitter,
  FaWordpress,
} from "react-icons/fa";
import toast from "react-hot-toast";

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

export default function ClientAssets() {
  const [credentials, setCredentials] = useState([]);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showPasswordIds, setShowPasswordIds] = useState({});

  // Modal State for Adding Credential
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPlatform, setNewPlatform] = useState("Instagram");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newNote, setNewNote] = useState("");
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [credRes, meRes] = await Promise.allSettled([
        clientApi.get("/client-portal/me/credentials"),
        clientApi.get("/client-portal/me"),
      ]);

      let creds = [];
      if (credRes.status === "fulfilled" && Array.isArray(credRes.value.data?.data)) {
        creds = credRes.value.data.data;
      }

      let client = null;
      if (meRes.status === "fulfilled" && meRes.value.data?.data) {
        client = meRes.value.data.data;
        if (!creds.length && Array.isArray(client.credentials) && client.credentials.length) {
          creds = client.credentials;
        }
      } else {
        // Fallback to cached clientData if available
        try {
          const cached = JSON.parse(localStorage.getItem("clientData") || "null");
          if (cached) {
            client = cached;
            if (!creds.length && Array.isArray(cached.credentials)) {
              creds = cached.credentials;
            }
          }
        } catch (e) {}
      }

      setCredentials(creds);
      setClientData(client);
      if (isManualRefresh) {
        toast.success("Assets & platform logins synced");
      }
    } catch (error) {
      console.error("[ClientAssets] Failed to fetch data:", error);
      toast.error("Could not load assets and logins.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    toast.success(`Copied ${key}!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswordIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getPlatformIcon = (platform = "") => {
    const p = platform.toLowerCase();
    if (p.includes("instagram")) return <FaInstagram />;
    if (p.includes("facebook") || p.includes("meta")) return <FaFacebook />;
    if (p.includes("youtube")) return <FaYoutube />;
    if (p.includes("drive") || p.includes("google")) return <FaGoogleDrive />;
    if (p.includes("linkedin")) return <FaLinkedin />;
    if (p.includes("twitter") || p.includes("x")) return <FaTwitter />;
    if (p.includes("wordpress") || p.includes("website") || p.includes("cms")) return <FaWordpress />;
    return <FiKey />;
  };

  const handleAddCredential = async (e) => {
    e.preventDefault();
    if (!newPlatform.trim() || !newUsername.trim()) {
      return toast.error("Platform and Username / Email are required");
    }

    try {
      setSubmitting(true);
      const res = await clientApi.post("/client-portal/me/credentials", {
        platform: newPlatform.trim(),
        username: newUsername.trim(),
        password: newPassword.trim(),
        note: newNote.trim(),
      });

      if (res.data?.success) {
        toast.success("Platform login added successfully!");
        setCredentials(res.data.data || []);
        setIsAddModalOpen(false);
        setNewPlatform("Instagram");
        setNewUsername("");
        setNewPassword("");
        setNewNote("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add login.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCredential = async (credId) => {
    if (!window.confirm("Are you sure you want to remove this login?")) return;
    try {
      const res = await clientApi.delete(`/client-portal/me/credentials/${credId}`);
      if (res.data?.success) {
        toast.success("Login deleted successfully.");
        setCredentials(res.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete login.");
    }
  };

  const driveUrl = clientData?.driveFolderLink || "";
  const calendarUrl =
    clientData?.contentCalendarLink || clientData?.googleSheetsConfig?.spreadsheetUrl || "";
  const brandLogoUrl = clientData?.profilePhoto?.url || "";
  const clientName = clientData?.clientName || clientData?.companyName || "Client";

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.loadingCard}
        >
          <span className="spin" style={{ fontSize: "1.4rem", color: "#059669" }}>⟳</span>
          <span style={{ fontWeight: 600, color: "#334155" }}>Loading Assets &amp; Logins...</span>
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
          <h1 className={styles.title}>Assets &amp; Platform Logins</h1>
          <p className={styles.subtitle}>
            Secure repository for authorized studio logins, master drive folders, and brand assets.
          </p>
        </div>

        <div className={styles.headerActions}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            className={styles.refreshBtn}
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? "spin" : ""} size={13} />
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            className={styles.primaryBtn}
            onClick={() => setIsAddModalOpen(true)}
          >
            <FiPlus size={15} />
            <span>Add Platform Login</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ================= ENCRYPTION NOTICE ================= */}
      <motion.div variants={itemVariants} className={styles.securityNotice}>
        <FiShield className={styles.securityIcon} />
        <div className={styles.securityText}>
          <strong>Enterprise Access Protection:</strong> All platform credentials, API tokens, and shared cloud folders are encrypted and strictly restricted to authorized Vidya Digital Studio creative staff.
        </div>
      </motion.div>

      {/* ================= DIGITAL STUDIO ASSETS & SHARED WORKSPACES ================= */}
      <motion.div variants={itemVariants} className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <FiFolder className={styles.sectionIcon} />
            <span>Digital Studio Master Workspaces</span>
          </div>
        </div>

        <div className={styles.assetsGrid}>
          {/* 1. Google Drive Creative Master Folder */}
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className={styles.assetCard}
          >
            <div className={styles.assetCardTop}>
              <div className={`${styles.assetIconWrap} ${styles.driveIconWrap}`}>
                <FaGoogleDrive />
              </div>
              <div className={styles.assetMeta}>
                <div className={styles.assetTitleRow}>
                  <div className={styles.assetName}>Google Drive Master Folder</div>
                  <span
                    className={`${styles.assetBadge} ${
                      driveUrl ? styles.badgeActive : styles.badgePending
                    }`}
                  >
                    {driveUrl ? "Active Workspace" : "Pending Link"}
                  </span>
                </div>
                <div className={styles.assetDesc}>
                  Raw video footage, 4K b-roll, high-resolution master exports, photoshoot selects, and project archives.
                </div>
              </div>
            </div>

            <div className={styles.assetActions}>
              {driveUrl ? (
                <>
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    href={driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.assetLinkBtn}
                  >
                    <span>Open in Drive</span>
                    <FiExternalLink size={13} />
                  </motion.a>
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    type="button"
                    className={styles.assetCopyBtn}
                    onClick={() => copyToClipboard(driveUrl, "Drive Link")}
                    title="Copy Drive Link"
                  >
                    {copiedId === "Drive Link" ? (
                      <FiCheck color="#059669" size={13} />
                    ) : (
                      <FiCopy size={13} />
                    )}
                  </motion.button>
                </>
              ) : (
                <div className={styles.pendingText}>
                  Drive folder assignment in progress by studio management.
                </div>
              )}
            </div>
          </motion.div>

          {/* 2. Content Calendar & Spreadsheet */}
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className={styles.assetCard}
          >
            <div className={styles.assetCardTop}>
              <div className={`${styles.assetIconWrap} ${styles.calendarIconWrap}`}>
                <FiCalendar />
              </div>
              <div className={styles.assetMeta}>
                <div className={styles.assetTitleRow}>
                  <div className={styles.assetName}>Content Calendar &amp; Schedule</div>
                  <span
                    className={`${styles.assetBadge} ${
                      calendarUrl ? styles.badgeActive : styles.badgePending
                    }`}
                  >
                    {calendarUrl ? "Live Synced" : "Internal Calendar"}
                  </span>
                </div>
                <div className={styles.assetDesc}>
                  Approved monthly schedule, posting calendar, creative briefs, approved captions, and upload tracker.
                </div>
              </div>
            </div>

            <div className={styles.assetActions}>
              {calendarUrl ? (
                <>
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    href={calendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.assetLinkBtn}
                  >
                    <span>Open Sheet</span>
                    <FiExternalLink size={13} />
                  </motion.a>
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    type="button"
                    className={styles.assetCopyBtn}
                    onClick={() => copyToClipboard(calendarUrl, "Calendar Link")}
                    title="Copy Calendar Link"
                  >
                    {copiedId === "Calendar Link" ? (
                      <FiCheck color="#059669" size={13} />
                    ) : (
                      <FiCopy size={13} />
                    )}
                  </motion.button>
                </>
              ) : (
                <a href="#/client-portal/calendar" className={styles.assetLinkBtn}>
                  <span>View Calendar</span>
                  <FiExternalLink size={13} />
                </a>
              )}
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* ================= PLATFORM CREDENTIALS ================= */}
      <motion.div variants={itemVariants} className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <FiKey className={styles.sectionIcon} />
            <span>Platform Credentials &amp; Delegated Logins</span>
          </div>
          <span className={styles.countBadge}>
            {credentials.length} account{credentials.length === 1 ? "" : "s"} saved
          </span>
        </div>

        {credentials.length > 0 ? (
          <div className={styles.credentialsGrid}>
            {credentials.map((cred) => {
              const isPasswordVisible = Boolean(showPasswordIds[cred._id]);

              return (
                <motion.div
                  key={cred._id}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className={styles.card}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.platformInfo}>
                      <div className={styles.platformIcon}>
                        {getPlatformIcon(cred.platform)}
                      </div>
                      <h3 className={styles.platformName}>{cred.platform}</h3>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      type="button"
                      className={styles.deleteCredBtn}
                      onClick={() => handleDeleteCredential(cred._id)}
                      title="Remove Login"
                      aria-label="Remove Login"
                    >
                      <FiTrash2 size={13} />
                    </motion.button>
                  </div>

                  {/* Username */}
                  <div className={styles.field}>
                    <span className={styles.label}>Username / Handle / Email</span>
                    <div className={styles.valueRow}>
                      <span className={styles.valueText}>{cred.username || "N/A"}</span>
                      {cred.username && (
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => copyToClipboard(cred.username, `${cred.platform} Username`)}
                          title="Copy Username"
                        >
                          {copiedId === `${cred.platform} Username` ? (
                            <FiCheck color="#059669" size={12} />
                          ) : (
                            <FiCopy size={12} />
                          )}
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Password */}
                  <div className={styles.field}>
                    <span className={styles.label}>Password</span>
                    <div className={styles.valueRow}>
                      <span
                        className={styles.valueText}
                        style={{ letterSpacing: isPasswordVisible ? "normal" : "2px" }}
                      >
                        {isPasswordVisible ? cred.password || "No password stored" : "••••••••••••"}
                      </span>
                      <div className={styles.btnWrap}>
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => togglePasswordVisibility(cred._id)}
                          title={isPasswordVisible ? "Hide Password" : "Show Password"}
                        >
                          {isPasswordVisible ? <FiEyeOff size={12} /> : <FiEye size={12} />}
                        </motion.button>
                        {cred.password && (
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => copyToClipboard(cred.password, `${cred.platform} Password`)}
                            title="Copy Password"
                          >
                            {copiedId === `${cred.platform} Password` ? (
                              <FiCheck color="#059669" size={12} />
                            ) : (
                              <FiCopy size={12} />
                            )}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes / Instructions */}
                  {cred.note && (
                    <div className={styles.noteField}>
                      <span className={styles.noteLabel}>Access Note:</span>
                      <span className={styles.noteText}>{cred.note}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiKey />
            </div>
            <h3 className={styles.emptyTitle}>No Platform Logins Saved Yet</h3>
            <p className={styles.emptyDesc}>
              Save your social media handles (Instagram, Meta, YouTube), website CMS, or ad account credentials here so our creative team can seamlessly publish your content.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              className={styles.primaryBtn}
              style={{ marginTop: "10px" }}
              onClick={() => setIsAddModalOpen(true)}
            >
              <FiPlus size={15} />
              <span>Add Your First Platform Login</span>
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* ================= ADD PLATFORM LOGIN MODAL ================= */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.modalBackdrop}
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ type: "spring", duration: 0.32, bounce: 0.08 }}
              className={styles.modalDialog}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Add Platform Login</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  className={styles.modalClose}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  <FiX size={16} />
                </motion.button>
              </div>

              <form onSubmit={handleAddCredential}>
                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Platform / Service *</label>
                    <select
                      className={styles.formSelect}
                      value={newPlatform}
                      onChange={(e) => setNewPlatform(e.target.value)}
                      required
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook / Meta">Facebook / Meta</option>
                      <option value="YouTube">YouTube / YouTube Studio</option>
                      <option value="Google Drive">Google Drive / Workspace</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Twitter / X">Twitter / X</option>
                      <option value="Website CMS / WordPress">Website CMS / WordPress</option>
                      <option value="Meta Ads Manager">Meta Ads Manager</option>
                      <option value="Google Ads">Google Ads</option>
                      <option value="Other">Other Platform</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Username / Handle / Email *</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. @brand_official or social@brand.com"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Password / Token</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type={showModalPassword ? "text" : "password"}
                        className={styles.formInput}
                        placeholder="Enter account password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ paddingRight: "2.8rem" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowModalPassword((prev) => !prev)}
                        style={{
                          position: "absolute",
                          right: "8px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#64748b",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        tabIndex="-1"
                      >
                        {showModalPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Access Note / 2FA Instructions</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. OTP is sent to +91-9876543210"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setIsAddModalOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className={styles.saveBtn}
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Save Platform Login"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
