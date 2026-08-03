import React, { useState } from "react";
import styles from "./ClientPortalSettings.module.css";
import { FiGlobe, FiLock, FiFileText, FiLink, FiCalendar } from "react-icons/fi";
import toast from "react-hot-toast";

export default function ClientPortalSettings({ form, setForm, readOnly }) {
  const [newDeliverable, setNewDeliverable] = useState("");

  const handleAddDeliverable = () => {
    if (!newDeliverable.trim()) return;
    const deliverables = form.deliverables || [];
    if (deliverables.includes(newDeliverable.trim())) {
      toast.error("Deliverable already exists");
      return;
    }
    setForm({ ...form, deliverables: [...deliverables, newDeliverable.trim()] });
    setNewDeliverable("");
  };

  const handleRemoveDeliverable = (item) => {
    if (readOnly) return;
    setForm({ ...form, deliverables: form.deliverables.filter(d => d !== item) });
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes("spreadsheets/d/")) {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        return `https://docs.google.com/spreadsheets/d/${match[1]}/htmlembed?widget=true&chrome=false`;
      }
    }
    return null;
  };

  const embedUrl = getEmbedUrl(form.contentCalendarLink);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <FiGlobe className={styles.icon} />
        <h3>Client Portal Settings</h3>
      </div>

      <div className={styles.grid}>
        {/* Password (only show on edit/create) */}
        {!readOnly && (
          <div className={styles.inputGroup}>
            <label>Set Portal Password</label>
            <div className={styles.inputWrapper}>
              <FiLock className={styles.inputIcon} />
              <input
                type="text"
                value={form.password || ""}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Leave blank to keep unchanged"
              />
            </div>
          </div>
        )}

        <div className={styles.inputGroup}>
          <label>Content Calendar Link</label>
          <div className={styles.inputWrapper}>
            <FiLink className={styles.inputIcon} />
            <input
              type="url"
              value={form.contentCalendarLink || ""}
              onChange={(e) => setForm({ ...form, contentCalendarLink: e.target.value })}
              placeholder="Google Sheets URL"
              disabled={readOnly}
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label>Google Drive Folder Link</label>
          <div className={styles.inputWrapper}>
            <FiLink className={styles.inputIcon} />
            <input
              type="url"
              value={form.driveFolderLink || ""}
              onChange={(e) => setForm({ ...form, driveFolderLink: e.target.value })}
              placeholder="Google Drive URL"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Calendar Preview inside Employee CRM */}
      {embedUrl && (
        <div className={styles.inputGroup}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa' }}>
            <FiCalendar /> Live Content Calendar Preview
          </label>
          <div style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #4b5563', background: '#111827', marginTop: '0.5rem' }}>
            <iframe
              src={embedUrl}
              title="Content Calendar Preview"
              width="100%"
              height="100%"
              frameBorder="0"
            ></iframe>
          </div>
        </div>
      )}

      <div className={styles.inputGroup}>
        <label>Plan Details</label>
        <div className={styles.inputWrapper}>
          <textarea
            value={form.planDetails || ""}
            onChange={(e) => setForm({ ...form, planDetails: e.target.value })}
            placeholder="Describe the client's plan..."
            disabled={readOnly}
            rows={4}
          />
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label>Deliverables</label>
        {!readOnly && (
          <div className={styles.addDeliverableRow}>
            <input
              type="text"
              value={newDeliverable}
              onChange={(e) => setNewDeliverable(e.target.value)}
              placeholder="e.g. 4 Reels, 2 Posts"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDeliverable())}
            />
            <button
              type="button"
              onClick={handleAddDeliverable}
              className={styles.addBtn}
            >
              Add
            </button>
          </div>
        )}
        <div className={styles.deliverablesList}>
          {(form.deliverables || []).map((item, idx) => (
            <span key={idx} className={styles.deliverableTag}>
              {item}
              {!readOnly && (
                <button type="button" onClick={() => handleRemoveDeliverable(item)} title="Remove">
                  &times;
                </button>
              )}
            </span>
          ))}
          {form.deliverables?.length === 0 && <span className={styles.emptyState}>No deliverables added.</span>}
        </div>
      </div>
    </div>
  );
}
