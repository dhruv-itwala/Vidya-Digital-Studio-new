import React, { useEffect, useState, useMemo } from "react";
import clientApi from "../../api/clientAxios";
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
} from "react-icons/fi";
import { FaGoogleDrive, FaInstagram } from "react-icons/fa";
import styles from "./ClientDashboard.module.css";
import ClientContentCalendar, {
  parseDateToYMD,
} from "../../components/ClientContentCalendar/ClientContentCalendar";
import PaymentModal from "../../components/PaymentModal/PaymentModal";

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

    // 1. Check live calendar entries if present
    if (calendarEntries && calendarEntries.length > 0) {
      calendarEntries.forEach((entry) => {
        const type = (
          entry.contentType ||
          entry["Content Type"] ||
          entry["content type"] ||
          entry.platform ||
          ""
        ).toLowerCase();

        // STRICTLY use Upload Status from the excel / google sheet (NEVER fallback to workStatus or entry.status)
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

        // Check if uploaded / live / published
        const isUploaded =
          rawUploadStatus === "uploaded" ||
          rawUploadStatus.startsWith("upload") ||
          rawUploadStatus.includes("pub") ||
          rawUploadStatus.includes("live") ||
          rawUploadStatus.includes("posted");

        // Check if scheduled
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

    // 2. Client plan package targets comparison / fallback
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

      // If package targets exist, ensure total is at least the target contract count
      counts.reels.total = Math.max(counts.reels.total, packageTargets.reels);
      counts.posts.total = Math.max(counts.posts.total, packageTargets.posts);
      counts.carousels.total = Math.max(counts.carousels.total, packageTargets.carousels);
    }

    // Default minimum realistic scope if entirely blank
    if (counts.reels.total === 0 && counts.posts.total === 0 && counts.carousels.total === 0) {
      counts.reels.total = 12;
      counts.posts.total = 8;
      counts.carousels.total = 4;
    }

    // Calculate pending (total planned/contracted minus actually uploaded)
    counts.reels.pending = Math.max(0, counts.reels.total - counts.reels.done);
    counts.posts.pending = Math.max(0, counts.posts.total - counts.posts.done);
    counts.carousels.pending = Math.max(0, counts.carousels.total - counts.carousels.done);
    counts.others.pending = Math.max(0, counts.others.total - counts.others.done);

    return counts;
  }, [calendarEntries, clientData]);

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#0f5c44", fontWeight: 700 }}>
        Loading Client Workspace...
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ padding: "2rem", color: "#dc2626", fontWeight: 600 }}>
          Failed to load client details. Please try signing in again.
        </div>
      </div>
    );
  }

  const clientName = clientData.clientName || clientData.companyName || "Client";
  const durationLabel = clientData.planDuration?.label || "Current Billing Cycle";

  return (
    <div className={styles.pageContainer}>
      {/* ================= HEADER ================= */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.welcomeTitle}>Welcome back, {clientName}</h1>
          <div className={styles.welcomeSub}>
            <span>Vidya Digital Studio Executive Client Portal</span>
            <span className={styles.activeRetainerPill}>
              <span className={styles.pulseGreen} />
              Active Retainer Plan
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadAllData(true)}
          disabled={refreshing}
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            color: "#0f172a",
            fontWeight: 600,
            fontSize: "0.82rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <FiRefreshCw size={13} className={refreshing ? "spin" : ""} />
          <span>{refreshing ? "Syncing..." : "Sync Workspace"}</span>
        </button>
      </div>

      {/* ================= NOTIFICATIONS FEED ================= */}
      <div className={styles.notificationsStack}>
        {/* 1. Today's Posting Alert */}
        {todaysPosting ? (
          <div className={`${styles.notificationCard} ${styles.notifPosting}`}>
            <div className={styles.notifLeft}>
              <div className={styles.notifIconWrap}>
                <FaInstagram />
              </div>
              <div>
                <div className={styles.notifTitle}>
                  Today's Scheduled Posting: {todaysPosting.topic || todaysPosting.title || todaysPosting.contentType || "Scheduled Content"}
                </div>
                <div className={styles.notifMeta}>
                  {todaysPosting.contentType || "Instagram Post"} · Upload Status:{" "}
                  <strong>{todaysPosting.uploadStatus || "Scheduled"}</strong>
                </div>
              </div>
            </div>
            <a href="#content-calendar" className={`${styles.notifActionBtn} ${styles.notifViewBtn}`}>
              <FiCalendar size={13} /> View on Calendar
            </a>
          </div>
        ) : (
          <div className={`${styles.notificationCard} ${styles.notifPosting}`}>
            <div className={styles.notifLeft}>
              <div className={styles.notifIconWrap}>
                <FiCheckCircle />
              </div>
              <div>
                <div className={styles.notifTitle}>Content Pipeline Up to Date</div>
                <div className={styles.notifMeta}>
                  No publishing scheduled for today ({new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}). Next releases are mapped in the calendar.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Pending Payment Notification */}
        {pendingPayment && (
          <div className={`${styles.notificationCard} ${styles.notifPayment}`}>
            <div className={styles.notifLeft}>
              <div className={styles.notifIconWrap}>
                <FiDollarSign />
              </div>
              <div>
                <div className={styles.notifTitle}>
                  Pending Payment: Invoice #{pendingPayment.invoiceNumber}
                </div>
                <div className={styles.notifMeta}>
                  Outstanding due of{" "}
                  <strong style={{ color: "#b45309" }}>
                    ₹{(pendingPayment.remainingAmount || pendingPayment.amount || 0).toLocaleString("en-IN")}
                  </strong>{" "}
                  {pendingPayment.dueDate ? `· Due on ${new Date(pendingPayment.dueDate).toLocaleDateString("en-IN")}` : ""}
                </div>
              </div>
            </div>
            <button
              type="button"
              className={`${styles.notifActionBtn} ${styles.notifPayBtn}`}
              onClick={() => setActivePaymentInvoice(pendingPayment)}
            >
              <FiDollarSign size={13} /> Pay Now
            </button>
          </div>
        )}
      </div>

      {/* ================= PLAN DETAILS & DURATION ================= */}
      <div className={styles.planDurationBanner}>
        <div className={styles.planInfoBlock}>
          <div className={styles.planLabel}>Current Plan Scope &amp; Retainer</div>
          <div className={styles.planTitle}>
            {clientData.planDetails
              ? clientData.planDetails.slice(0, 70)
              : "Creative Growth & Production Retainer"}
          </div>
          <div className={styles.planScope}>
            {clientData.planDetails ||
              "Full-service content ideation, reels filming, graphic carousels, caption copywriting, and multi-platform publishing managed by Vidya Digital Studio."}
          </div>
        </div>

        <div className={styles.durationBlock}>
          <FiClock className={styles.durationIcon} />
          <div>
            <div className={styles.durationLabel}>Billing Cycle Duration</div>
            <div className={styles.durationVal}>{durationLabel}</div>
          </div>
        </div>
      </div>

      {/* ================= DELIVERABLES TARGET GRAPHICAL DASHBOARD ================= */}
      <div>
        <div className={styles.sectionHeading}>
          <FiLayers color="#0f5c44" />
          <span>Deliverables Target &amp; Progress</span>
        </div>

        <div className={styles.deliverablesGrid}>
          {/* Reels Card */}
          <div className={styles.deliverableCard}>
            <div className={styles.deliverableTop}>
              <div className={styles.deliverableFormat}>Instagram Reels</div>
              <div className={`${styles.formatIconWrap} ${styles.reelsIcon}`}>
                <FiPlayCircle />
              </div>
            </div>
            <div className={styles.deliverableNumbers}>
              <span className={styles.statLarge}>{deliverablesBreakdown.reels.done}</span>
              <span className={styles.statMuted}>/ {deliverablesBreakdown.reels.total} Uploaded</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (deliverablesBreakdown.reels.done / (deliverablesBreakdown.reels.total || 1)) * 100
                    )
                  )}%`,
                  background: "#db2777",
                }}
              />
            </div>
            <div className={styles.deliverableFoot}>
              <span className={styles.doneBadge}>
                {Math.round((deliverablesBreakdown.reels.done / (deliverablesBreakdown.reels.total || 1)) * 100)}% Uploaded
              </span>
              <span className={styles.pendingBadge}>
                {deliverablesBreakdown.reels.pending} Reels Pending
                {deliverablesBreakdown.reels.scheduled > 0
                  ? ` (${deliverablesBreakdown.reels.scheduled} Scheduled)`
                  : ""}
              </span>
            </div>
          </div>

          {/* Posts Card */}
          <div className={styles.deliverableCard}>
            <div className={styles.deliverableTop}>
              <div className={styles.deliverableFormat}>Static Graphics &amp; Posts</div>
              <div className={`${styles.formatIconWrap} ${styles.postIcon}`}>
                <FiImage />
              </div>
            </div>
            <div className={styles.deliverableNumbers}>
              <span className={styles.statLarge}>{deliverablesBreakdown.posts.done}</span>
              <span className={styles.statMuted}>/ {deliverablesBreakdown.posts.total} Uploaded</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (deliverablesBreakdown.posts.done / (deliverablesBreakdown.posts.total || 1)) * 100
                    )
                  )}%`,
                  background: "#2563eb",
                }}
              />
            </div>
            <div className={styles.deliverableFoot}>
              <span className={styles.doneBadge}>
                {Math.round((deliverablesBreakdown.posts.done / (deliverablesBreakdown.posts.total || 1)) * 100)}% Uploaded
              </span>
              <span className={styles.pendingBadge}>
                {deliverablesBreakdown.posts.pending} Posts Pending
                {deliverablesBreakdown.posts.scheduled > 0
                  ? ` (${deliverablesBreakdown.posts.scheduled} Scheduled)`
                  : ""}
              </span>
            </div>
          </div>

          {/* Carousels Card */}
          <div className={styles.deliverableCard}>
            <div className={styles.deliverableTop}>
              <div className={styles.deliverableFormat}>Multi-Slide Carousels</div>
              <div className={`${styles.formatIconWrap} ${styles.carouselIcon}`}>
                <FiLayers />
              </div>
            </div>
            <div className={styles.deliverableNumbers}>
              <span className={styles.statLarge}>{deliverablesBreakdown.carousels.done}</span>
              <span className={styles.statMuted}>/ {deliverablesBreakdown.carousels.total} Uploaded</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (deliverablesBreakdown.carousels.done / (deliverablesBreakdown.carousels.total || 1)) * 100
                    )
                  )}%`,
                  background: "#7c3aed",
                }}
              />
            </div>
            <div className={styles.deliverableFoot}>
              <span className={styles.doneBadge}>
                {Math.round((deliverablesBreakdown.carousels.done / (deliverablesBreakdown.carousels.total || 1)) * 100)}% Uploaded
              </span>
              <span className={styles.pendingBadge}>
                {deliverablesBreakdown.carousels.pending} Carousels Pending
                {deliverablesBreakdown.carousels.scheduled > 0
                  ? ` (${deliverablesBreakdown.carousels.scheduled} Scheduled)`
                  : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= WORKSPACE LINKS ================= */}
      <div>
        <div className={styles.sectionHeading}>
          <FiExternalLink color="#0f5c44" />
          <span>Client Workspace Links</span>
        </div>

        <div className={styles.workspaceLinksGrid}>
          {/* Content Calendar */}
          <a
            href={clientData.contentCalendarLink || "#content-calendar"}
            target={clientData.contentCalendarLink ? "_blank" : "_self"}
            rel="noreferrer"
            className={styles.workspaceCard}
          >
            <div className={styles.workspaceCardLeft}>
              <div className={`${styles.workspaceIconWrap} ${styles.calendarIconWrap}`}>
                <FiCalendar />
              </div>
              <div>
                <div className={styles.workspaceTitle}>Content Calendar</div>
                <div className={styles.workspaceSub}>
                  {clientData.googleSheetsConfig?.sheetTitle
                    ? `${clientData.googleSheetsConfig.sheetTitle} (Live Synced)`
                    : "Direct Google Sheet Calendar"}
                </div>
              </div>
            </div>
            <FiChevronRight className={styles.workspaceCardArrow} />
          </a>

          {/* Google Drive */}
          <a
            href={clientData.driveFolderLink || "#"}
            target={clientData.driveFolderLink ? "_blank" : "_self"}
            rel="noreferrer"
            className={styles.workspaceCard}
            style={{ opacity: clientData.driveFolderLink ? 1 : 0.6 }}
          >
            <div className={styles.workspaceCardLeft}>
              <div className={`${styles.workspaceIconWrap} ${styles.driveIconWrap}`}>
                <FaGoogleDrive />
              </div>
              <div>
                <div className={styles.workspaceTitle}>Google Drive Assets</div>
                <div className={styles.workspaceSub}>
                  {clientData.driveFolderLink
                    ? "Raw Footage, High-Res Exports & Assets"
                    : "Drive Link Pending Assignment"}
                </div>
              </div>
            </div>
            <FiChevronRight className={styles.workspaceCardArrow} />
          </a>
        </div>
      </div>

      {/* ================= NATIVE CONTENT CALENDAR ================= */}
      <div id="content-calendar" className={styles.calendarWrapper}>
        <div className={styles.sectionHeading} style={{ marginBottom: "1rem" }}>
          <FiCalendar color="#0f5c44" />
          <span>Interactive Content Calendar</span>
        </div>
        <ClientContentCalendar />
      </div>

      {/* ================= PAYMENT MODAL ================= */}
      {activePaymentInvoice && (
        <PaymentModal
          invoice={activePaymentInvoice}
          onClose={() => setActivePaymentInvoice(null)}
        />
      )}
    </div>
  );
}
