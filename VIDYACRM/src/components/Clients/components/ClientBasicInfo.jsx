import { useEffect } from "react";
import styles from "../ClientForm.module.css";
import { FiUser } from "react-icons/fi";

export default function ClientBasicInfo({
  form,
  setForm,
  readOnly,
  photoPreview,
  setPhotoPreview,
}) {
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* ================= CLEAN OBJECT URL ================= */
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  return (
    <>
      <h3 className={styles.sectionTitle}>Basic Information</h3>

      {/* Profile Photo */}
      <div className={styles.inputGroupFull}>
        <label>Profile Photo</label>
        <div className={styles.photoUploadRow}>
          <div className={styles.previewWrapper}>
            {(photoPreview || form.profilePhoto?.url) ? (
              <img
                src={photoPreview || form.profilePhoto?.url}
                alt="profile"
                className={styles.previewImage}
              />
            ) : (
              <FiUser size={32} color="#94a3b8" />
            )}
          </div>

          {!readOnly && (
            <input
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;

                setForm((prev) => ({ ...prev, profilePhoto: file }));
                setPhotoPreview(URL.createObjectURL(file));
              }}
            />
          )}
        </div>
      </div>

      {/* TEXT FIELDS */}
      <div className={styles.grid2}>
        <div className={styles.inputGroup}>
          <label>Client Name <span className={styles.required}>*</span></label>
          <input
            type="text"
            name="clientName"
            value={form.clientName || ""}
            onChange={handleChange}
            disabled={readOnly}
            required
            className={styles.inputField}
            placeholder="Business or Client Name"
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Owner Name</label>
          <input
            type="text"
            name="ownerName"
            value={form.ownerName || ""}
            onChange={handleChange}
            disabled={readOnly}
            className={styles.inputField}
            placeholder="Primary Contact Person"
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Email Address</label>
          <input
            type="email"
            name="email"
            value={form.email || ""}
            onChange={handleChange}
            disabled={readOnly}
            className={styles.inputField}
            placeholder="client@example.com"
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={form.phone || ""}
            onChange={handleChange}
            disabled={readOnly}
            className={styles.inputField}
            placeholder="+1 234 567 890"
          />
        </div>

        {/* Onboarding Date */}
        <div className={styles.inputGroup}>
          <label>Onboarding Date</label>
          <input
            type="date"
            name="onboardingDate"
            value={form.onboardingDate || ""}
            onChange={handleChange}
            disabled={readOnly}
            className={styles.inputField}
          />
        </div>
      </div>

      {/* Address */}
      <div className={styles.inputGroupFull}>
        <label>Full Address</label>
        <textarea
          name="address"
          value={form.address || ""}
          onChange={handleChange}
          disabled={readOnly}
          className={styles.textareaField}
          placeholder="Enter full business address..."
          rows="2"
        />
      </div>

      {/* Notes */}
      <div className={styles.inputGroupFull}>
        <label>Internal Notes</label>
        <textarea
          name="notes"
          value={form.notes || ""}
          onChange={handleChange}
          disabled={readOnly}
          className={styles.textareaField}
          placeholder="Add any internal notes, context, or special requirements..."
          rows="3"
        />
      </div>
    </>
  );
}
