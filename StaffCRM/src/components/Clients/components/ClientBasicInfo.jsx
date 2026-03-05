import { useEffect } from "react";
import styles from "../ClientForm.module.css";

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
    <div className={styles.card}>
      <h3>Basic Information</h3>

      {/* Profile Photo */}
      <div className={styles.formGroup}>
        {(photoPreview || form.profilePhoto?.url) && (
          <img
            src={photoPreview || form.profilePhoto?.url}
            alt="profile"
            className={styles.previewImage}
          />
        )}

        <label>Profile Photo</label>

        {!readOnly && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              setForm((prev) => ({ ...prev, profilePhoto: file }));
              setPhotoPreview(URL.createObjectURL(file));
            }}
          />
        )}
      </div>

      {/* TEXT FIELDS */}
      {[
        { label: "Client Name *", name: "clientName", required: true },
        { label: "Owner Name", name: "ownerName" },
        { label: "Email", name: "email", type: "email" },
        { label: "Phone", name: "phone", type: "tel" },
      ].map((field) => (
        <div className={styles.formGroup} key={field.name}>
          <label>{field.label}</label>
          <input
            type={field.type || "text"}
            name={field.name}
            value={form[field.name] || ""}
            onChange={handleChange}
            disabled={readOnly}
            required={field.required}
          />
        </div>
      ))}

      {/* Onboarding Date */}
      <div className={styles.formGroup}>
        <label>Onboarding Date</label>
        <input
          type="date"
          name="onboardingDate"
          value={form.onboardingDate || ""}
          onChange={handleChange}
          disabled={readOnly}
        />
      </div>

      {/* Address */}
      <div className={styles.formGroup}>
        <label>Address</label>
        <textarea
          name="address"
          value={form.address || ""}
          onChange={handleChange}
          disabled={readOnly}
        />
      </div>

      {/* Notes */}
      <div className={styles.formGroup}>
        <label>Notes</label>
        <textarea
          name="notes"
          value={form.notes || ""}
          onChange={handleChange}
          disabled={readOnly}
        />
      </div>
    </div>
  );
}
