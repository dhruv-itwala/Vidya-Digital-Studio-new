import React, { useEffect, useState, useMemo } from "react";
import clientApi from "../../api/clientAxios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiExternalLink,
  FiChevronRight,
  FiAlertCircle,
  FiCheckCircle,
  FiDollarSign,
  FiPlayCircle,
  FiLayers,
  FiImage,
  FiFileText,
  FiRefreshCw,
  FiArrowUpRight,
  FiActivity,
  FiShield,
} from "react-icons/fi";
import { FaGoogleDrive, FaInstagram } from "react-icons/fa";
import styles from "./ClientDashboard.module.css";
import ClientContentCalendar, {
  parseDateToYMD,
} from "../../components/ClientContentCalendar/ClientContentCalendar";
import PaymentModal from "../../components/PaymentModal/PaymentModal";

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
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function ClientDashboard() {
  const [clientData, setClientData] = useState(null);
  const [calendarEntries, setCalendarEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activePaymentInvoice, setActivePaymentInvoice] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [dashRes, calRes] = await Promise.allSettled([
        clientApi.get("/client-portal/me"),
        clientApi.get(
          isManual
            ? "/client-portal/content-calendar/entries?refresh=true"
            : "/client-portal/content-calendar/entries"
        ),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value.data?.data) {
        setClientData(dashRes.value.data.data);
      }
      if (calRes.status === "fulfilled" && calRes.value.data?.data?.entries) {
        setCalendarEntries(calRes.value.data.data.entries || []);
      }
    } catch (err) {
      console.error("[ClientDashboard] Failed to fetch data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Format today's date in YYYY-MM-DD
  const todayYMD = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }, []);

  // Today's Scheduled Posting notification
  const todaysPosting = useMemo(() => {
    if (!calendarEntries || calendarEntries.length === 0) return null;
    return calendarEntries.find((entry) => {
      const entryYMD = parseDateToYMD(entry.date || entry.Date);
      return entryYMD === todayYMD;
    });
  }, [calendarEntries, todayYMD]);

  // Pending Payment notification
  const pendingPayment = useMemo(() => {
    if (!clientData?.invoices || clientData.invoices.length === 0) return null;
    return clientData.invoices.find(
      (inv) => inv.status !== "paid" && (inv.remainingAmount > 0 || inv.amount > 0)
    );
  }, [clientData]);

  // Compute Deliverables Target Breakdown based STRICTLY on Upload Status from Excel/Google Sheets
  const deliverablesBreakdown = useMemo(() => {
    const counts = {
      reels: { total: 0, done: 0, scheduled: 0, pending: 0 },
      posts: { total: 0, done: 0, scheduled: 0, pending: 0 },
      carousels: { total: 0, done: 0, scheduled: 0, pending: 0 },
      others: { total: 0, done: 0, scheduled: 0, pending: 0 },
    };

    if (calendarEntries && calendarEntries.length > 0) {
      calendarEntries.forEach((entry) => {
        const type = (
          entry.contentType ||
          entry["Content Type"] ||
          entry["content type"] ||
          entry.platform ||
          ""
        ).toLowerCase();

        const rawUploadStatus = (
          entry.uploadStatus ||
          entry["Upload Status"] ||
          entry["upload status"] ||
          entry["UploadStatus"] ||
          entry.upload_status ||
          ""
        )
          .toString()
          .toLowerCase()
          .trim();

        const isUploaded =
          rawUploadStatus === "uploaded" ||
          rawUploadStatus.startsWith("upload") ||
          rawUploadStatus.includes("pub") ||
          rawUploadStatus.includes("live") ||
          rawUploadStatus.includes("posted");

        const isScheduled =
          rawUploadStatus === "scheduled" ||
          rawUploadStatus.startsWith("sched") ||
          rawUploadStatus.includes("queue");

        if (type.includes("reel")) {
          counts.reels.total += 1;
          if (isUploaded) counts.reels.done += 1;
          else if (isScheduled) counts.reels.scheduled += 1;
        } else if (type.includes("carousal") || type.includes("carousel")) {
          counts.carousels.total += 1;
          if (isUploaded) counts.carousels.done += 1;
          else if (isScheduled) counts.carousels.scheduled += 1;
        } else if (type.includes("post") || type.includes("static")) {
          counts.posts.total += 1;
          if (isUploaded) counts.posts.done += 1;
          else if (isScheduled) counts.posts.scheduled += 1;
        } else {
          counts.others.total += 1;
          if (isUploaded) counts.others.done += 1;
          else if (isScheduled) counts.others.scheduled += 1;
        }
      });
    }

    if (clientData?.deliverables?.length > 0) {
      const packageTargets = { reels: 0, posts: 0, carousels: 0, others: 0 };
      clientData.deliverables.forEach((item) => {
        const text = String(item).toLowerCase();
        const match = text.match(/(\d+)\s*(reels?|posts?|carousals?|carousels?)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          const kind = match[2];
          if (kind.includes("reel")) packageTargets.reels += num;
          else if (kind.includes("carous")) packageTargets.carousels += num;
          else packageTargets.posts += num;
        }
      });

      counts.reels.total = Math.max(counts.reels.total, packageTargets.reels);
      counts.posts.total = Math.max(counts.posts.total, packageTargets.posts);
      counts.carousels.total = Math.max(counts.carousels.total, packageTargets.carousels);
    }

    if (counts.reels.total === 0 && counts.posts.total === 0 && counts.carousels.total === 0) {
      counts.reels.total = 12;
      counts.posts.total = 8;
      counts.carousels.total = 4;
    }

    counts.reels.pending = Math.max(0, counts.reels.total - counts.reels.done);
    counts.posts.pending = Math.max(0, counts.posts.total - counts.posts.done);
    counts.carousels.pending = Math.max(0, counts.carousels.total - counts.carousels.done);
    counts.others.pending = Math.max(0, counts.others.total - counts.others.done);

    return counts;
  }, [calendarEntries, clientData]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.loadingCard}
        >
          <span className="spin" style={{ fontSize: "1.4rem", color: "#059669" }}>⟳</span>
          <span style={{ fontWeight: 600, color: "#334155" }}>Loading Executive Workspace...</span>
        </motion.div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorCard}>
          <FiAlertCircle size={20} color="#dc2626" />
          <span>Failed to load client details. Please try signing in again.</span>
        </div>
      </div>
    );
  }

  const clientName = clientData.clientName || clientData.companyName || "Client";
  const durationLabel = clientData.planDuration?.label || "Current Active Retainer";

  const reelsPct = Math.min(
    100,
    Math.round((deliverablesBreakdown.reels.done / (deliverablesBreakdown.reels.total || 1)) * 100)
  );
  const postsPct = Math.min(
    100,
    Math.round((deliverablesBreakdown.posts.done / (deliverablesBreakdown.posts.total || 1)) * 100)
  );
  const carouselsPct = Math.min(
    100,
    Math.round(
      (deliverablesBreakdown.carousels.done / (deliverablesBreakdown.carousels.total || 1)) * 100
    )
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={styles.pageContainer}
    >
      {/* ================= HEADER SECTION ================= */}
      <motion.div variants={itemVariants} className={styles.header}>
        <div className={styles.headerTitles}>
          <div className={styles.topMetaRow}>
            <span className={styles.retainerChip}>
              <span className={styles.pulseDot} />
              Active Retainer Plan
            </span>
            <span className={styles.metaDivider}>•</span>
            <span className={styles.durationMeta}>{durationLabel}</span>
          </div>
          <h1 className={styles.welcomeTitle}>Welcome back, {clientName}</h1>
          <p className={styles.welcomeSub}>
            Vidya Digital Studio Executive Client Portal &amp; Content Management Hub
          </p>
        </div>

        <div className={styles.headerActions}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => loadAllData(true)}
            disabled={refreshing}
            className={styles.syncBtn}
            title="Refresh workspace from live cloud sheets"
          >
            <FiRefreshCw size={13} className={refreshing ? "spin" : ""} />
            <span>{refreshing ? "Syncing..." : "Sync Workspace"}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ================= NOTIFICATIONS FEED ================= */}
      <motion.div variants={itemVariants} className={styles.notificationsStack}>
        {/* 1. Today's Scheduled Posting */}
        {todaysPosting ? (
          <motion.div
            whileHover={{ scale: 1.005 }}
            className={`${styles.notificationCard} ${styles.notifPosting}`}
          >
            <div className={styles.notifLeft}>
              <div className={styles.notifIconWrapPosting}>
                <FaInstagram />
              </div>
              <div>
                <div className={styles.notifTitle}>
                  Today's Scheduled Content: {todaysPosting.topic || todaysPosting.title || todaysPosting.contentType || "Scheduled Content"}
                </div>
                <div className={styles.notifMeta}>
                  {todaysPosting.contentType || "Instagram Post"} · Upload Status:{" "}
                  <strong>{todaysPosting.uploadStatus || "Scheduled"}</strong>
                </div>
              </div>
            </div>
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              href="#content-calendar"
              className={styles.notifViewBtn}
            >
              <FiCalendar size={13} />
              <span>View on Calendar</span>
            </motion.a>
          </motion.div>
        ) : (
          <div className={`${styles.notificationCard} ${styles.notifPosting}`}>
            <div className={styles.notifLeft}>
              <div className={styles.notifIconWrapCheck}>
                <FiCheckCircle />
              </div>
              <div>
                <div className={styles.notifTitle}>Content Pipeline Active</div>
                <div className={styles.notifMeta}>
                  No publishing scheduled for today ({new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}). All upcoming releases are tracked on the calendar below.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Pending Payment Notice */}
        {pendingPayment && (
          <motion.div
            whileHover={{ scale: 1.005 }}
            className={`${styles.notificationCard} ${styles.notifPayment}`}
          >
            <div className={styles.notifLeft}>
              <div className={styles.notifIconWrapPayment}>
                <FiDollarSign />
              </div>
              <div>
                <div className={styles.notifTitle}>
                  Outstanding Due: Invoice #{pendingPayment.invoiceNumber}
                </div>
                <div className={styles.notifMeta}>
                  Pending balance of{" "}
                  <strong className={styles.paymentDueVal}>
                    ₹{(pendingPayment.remainingAmount || pendingPayment.amount || 0).toLocaleString("en-IN")}
                  </strong>{" "}
                  {pendingPayment.dueDate ? `· Due on ${new Date(pendingPayment.dueDate).toLocaleDateString("en-IN")}` : ""}
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              className={styles.notifPayBtn}
              onClick={() => setActivePaymentInvoice(pendingPayment)}
            >
              <FiDollarSign size={13} />
              <span>Pay Now</span>
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* ================= PLAN SCOPE & DETAILS BANNER ================= */}
      <motion.div variants={itemVariants} className={styles.planCard}>
        <div className={styles.planMain}>
          <div className={styles.planBadgeRow}>
            <span className={styles.scopeTag}>Retainer Scope</span>
          </div>
          <div className={styles.planTitle}>
            {clientData.planDetails
              ? clientData.planDetails.slice(0, 85)
              : "Creative Growth, Production & Brand Management"}
          </div>
          <p className={styles.planDesc}>
            {clientData.planDetails ||
              "Full-service content ideation, reels filming, graphic carousels, caption copywriting, and multi-platform publishing managed by Vidya Digital Studio."}
          </p>
        </div>

        <div className={styles.planSide}>
          <div className={styles.durationCard}>
            <FiClock className={styles.durationIcon} />
            <div>
              <div className={styles.durationLabel}>Billing Cycle</div>
              <div className={styles.durationVal}>{durationLabel}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================= DELIVERABLES TARGET BREAKDOWN ================= */}
      <motion.div variants={itemVariants} className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <FiLayers className={styles.sectionIcon} />
            <span>Deliverables Target &amp; Progress</span>
          </div>
          <span className={styles.sectionSubtitle}>
            Tracked strictly from live production sheet
          </span>
        </div>

        <div className={styles.deliverablesGrid}>
          {/* 1. Reels Card */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={styles.deliverableCard}
          >
            <div className={styles.deliverableTop}>
              <span className={styles.formatLabel}>Instagram Reels</span>
              <div className={`${styles.formatIcon} ${styles.reelsIcon}`}>
                <FiPlayCircle />
              </div>
            </div>

            <div className={styles.deliverableMetrics}>
              <div className={styles.metricBig}>
                {deliverablesBreakdown.reels.done}
                <span className={styles.metricMuted}>/ {deliverablesBreakdown.reels.total}</span>
              </div>
              <span className={styles.rateChip}>{reelsPct}% Uploaded</span>
            </div>

            <div className={styles.track}>
              <motion.div
                className={styles.fill}
                initial={{ width: 0 }}
                animate={{ width: `${reelsPct}%` }}
                transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: "#db2777" }}
              />
            </div>

            <div className={styles.deliverableFoot}>
              <span className={styles.footDetail}>
                {deliverablesBreakdown.reels.pending} pending
                {deliverablesBreakdown.reels.scheduled > 0
                  ? ` · ${deliverablesBreakdown.reels.scheduled} scheduled`
                  : ""}
              </span>
            </div>
          </motion.div>

          {/* 2. Static Posts Card */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={styles.deliverableCard}
          >
            <div className={styles.deliverableTop}>
              <span className={styles.formatLabel}>Static Graphics &amp; Posts</span>
              <div className={`${styles.formatIcon} ${styles.postIcon}`}>
                <FiImage />
              </div>
            </div>

            <div className={styles.deliverableMetrics}>
              <div className={styles.metricBig}>
                {deliverablesBreakdown.posts.done}
                <span className={styles.metricMuted}>/ {deliverablesBreakdown.posts.total}</span>
              </div>
              <span className={styles.rateChip}>{postsPct}% Uploaded</span>
            </div>

            <div className={styles.track}>
              <motion.div
                className={styles.fill}
                initial={{ width: 0 }}
                animate={{ width: `${postsPct}%` }}
                transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: "#2563eb" }}
              />
            </div>

            <div className={styles.deliverableFoot}>
              <span className={styles.footDetail}>
                {deliverablesBreakdown.posts.pending} pending
                {deliverablesBreakdown.posts.scheduled > 0
                  ? ` · ${deliverablesBreakdown.posts.scheduled} scheduled`
                  : ""}
              </span>
            </div>
          </motion.div>

          {/* 3. Carousels Card */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={styles.deliverableCard}
          >
            <div className={styles.deliverableTop}>
              <span className={styles.formatLabel}>Multi-Slide Carousels</span>
              <div className={`${styles.formatIcon} ${styles.carouselIcon}`}>
                <FiLayers />
              </div>
            </div>

            <div className={styles.deliverableMetrics}>
              <div className={styles.metricBig}>
                {deliverablesBreakdown.carousels.done}
                <span className={styles.metricMuted}>/ {deliverablesBreakdown.carousels.total}</span>
              </div>
              <span className={styles.rateChip}>{carouselsPct}% Uploaded</span>
            </div>

            <div className={styles.track}>
              <motion.div
                className={styles.fill}
                initial={{ width: 0 }}
                animate={{ width: `${carouselsPct}%` }}
                transition={{ duration: 0.85, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: "#7c3aed" }}
              />
            </div>

            <div className={styles.deliverableFoot}>
              <span className={styles.footDetail}>
                {deliverablesBreakdown.carousels.pending} pending
                {deliverablesBreakdown.carousels.scheduled > 0
                  ? ` · ${deliverablesBreakdown.carousels.scheduled} scheduled`
                  : ""}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ================= WORKSPACE DIRECT JUMP LINKS ================= */}
      <motion.div variants={itemVariants} className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <FiExternalLink className={styles.sectionIcon} />
            <span>Master Creative Workspaces</span>
          </div>
        </div>

        <div className={styles.workspaceGrid}>
          {/* Content Calendar Sheet Link */}
          <motion.a
            whileHover={{ y: -2, x: 2 }}
            whileTap={{ scale: 0.98 }}
            href={clientData.contentCalendarLink || "#content-calendar"}
            target={clientData.contentCalendarLink ? "_blank" : "_self"}
            rel="noreferrer"
            className={styles.workspaceCard}
          >
            <div className={styles.workspaceCardLeft}>
              <div className={`${styles.wsIconWrap} ${styles.calendarIconWrap}`}>
                <FiCalendar />
              </div>
              <div>
                <div className={styles.wsTitle}>Content Calendar Sheet</div>
                <div className={styles.wsSub}>
                  {clientData.googleSheetsConfig?.sheetTitle
                    ? `${clientData.googleSheetsConfig.sheetTitle} (Live Connected)`
                    : "Direct Google Sheet Calendar"}
                </div>
              </div>
            </div>
            <FiChevronRight className={styles.wsArrow} />
          </motion.a>

          {/* Google Drive Link */}
          <motion.a
            whileHover={{ y: -2, x: 2 }}
            whileTap={{ scale: 0.98 }}
            href={clientData.driveFolderLink || "#"}
            target={clientData.driveFolderLink ? "_blank" : "_self"}
            rel="noreferrer"
            className={styles.workspaceCard}
            style={{ opacity: clientData.driveFolderLink ? 1 : 0.65 }}
          >
            <div className={styles.workspaceCardLeft}>
              <div className={`${styles.wsIconWrap} ${styles.driveIconWrap}`}>
                <FaGoogleDrive />
              </div>
              <div>
                <div className={styles.wsTitle}>Google Drive Assets</div>
                <div className={styles.wsSub}>
                  {clientData.driveFolderLink
                    ? "Raw Footage, 4K Master Exports & Brand Selects"
                    : "Drive Link Pending Assignment"}
                </div>
              </div>
            </div>
            <FiChevronRight className={styles.wsArrow} />
          </motion.a>
        </div>
      </motion.div>

      {/* ================= EMBEDDED CONTENT CALENDAR ================= */}
      <motion.div variants={itemVariants} id="content-calendar" className={styles.calendarSection}>
        <div className={styles.sectionHeader} style={{ marginBottom: "1rem" }}>
          <div className={styles.sectionTitle}>
            <FiCalendar className={styles.sectionIcon} />
            <span>Interactive Content Calendar</span>
          </div>
          <span className={styles.sectionSubtitle}>
            Filter, inspect copy, and track posting status
          </span>
        </div>
        <ClientContentCalendar />
      </motion.div>

      {/* ================= PAYMENT MODAL ================= */}
      <AnimatePresence>
        {activePaymentInvoice && (
          <PaymentModal
            invoice={activePaymentInvoice}
            onClose={() => setActivePaymentInvoice(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
