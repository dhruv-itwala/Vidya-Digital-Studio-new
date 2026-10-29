import React, { useState } from "react";
import styles from "./ClientPortalSettings.module.css";
import { FiGlobe, FiLock, FiLink, FiCheckCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import InlineLoader from "../../UI/InlineLoader";

export default function ClientPortalSettings({
  form,
  setForm,
  readOnly,
  isEdit = false,
  onUpdate = null,
  updating = false,
}) {
  const [newDeliverable, setNewDeliverable] = useState("");

  const handleSavePortal = () => {
    if (onUpdate) {
      const portalData = {
        contentCalendarLink: form.contentCalendarLink || "",
        driveFolderLink: form.driveFolderLink || "",
        planDetails: form.planDetails || "",
        deliverables: form.deliverables || [],
      };
      if (form.password && form.password.trim()) {
        portalData.password = form.password.trim();
      }
      onUpdate(portalData);
    }
  };

  const handleAddDeliverable = () => {
    const trimmed = newDeliverable.trim();
    if (!trimmed) return;
    const deliverables = form.deliverables || [];
    if (deliverables.includes(trimmed)) {
      toast.error("Deliverable already exists");
      return;
    }
    setForm((prev) => ({
      ...prev,
      deliverables: [...deliverables, trimmed],
    }));
    setNewDeliverable("");
  };

  const handleRemoveDeliverable = (item) => {
    if (readOnly) return;
    setForm((prev) => ({
      ...prev,
      deliverables: (prev.deliverables || []).filter((d) => d !== item),
    }));
  };

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
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
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
              onChange={(e) =>
                setForm((prev) => ({ ...prev, contentCalendarLink: e.target.value }))
              }
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
              onChange={(e) =>
                setForm((prev) => ({ ...prev, driveFolderLink: e.target.value }))
              }
              placeholder="Google Drive URL"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      <div className={styles.inputGroup} style={{ marginTop: "1rem" }}>
        <label>Plan Details</label>
        <div className={styles.inputWrapper}>
          <textarea
            value={form.planDetails || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, planDetails: e.target.value }))}
            placeholder="Describe the client's plan, retainer deliverables, or monthly scope..."
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
              placeholder="e.g. 4 Reels, 2 Posts, 1 Newsletter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddDeliverable();
                }
              }}
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
                <button
                  type="button"
                  onClick={() => handleRemoveDeliverable(item)}
                  title="Remove deliverable"
                >
                  &times;
                </button>
              )}
            </span>
          ))}
          {(!form.deliverables || form.deliverables.length === 0) && (
            <span className={styles.emptyState}>No deliverables added.</span>
          )}
        </div>
      </div>

      {/* Independent Update Button for Client Portal Settings */}
      {isEdit && !readOnly && onUpdate && (
        <div className={styles.sectionAction}>
          <button
            type="button"
            className={styles.updateBtn}
            onClick={handleSavePortal}
            disabled={updating}
          >
            {updating ? <InlineLoader size={16} /> : <FiCheckCircle />}
            <span>{updating ? "Updating Portal Settings..." : "Update Client Portal Settings"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
