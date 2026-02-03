import { useState } from "react";
import styles from "../CreateClient.module.css";

const BasicInfoSection = ({
  register,
  errors,
  existingPhoto,
  onProfileChange,
}) => {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview (instant UX)
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      setUploading(true);
      await onProfileChange(file); // 🔥 parent handles base64 + API call
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className={styles.section}>
      <h3 className={styles.h3}>Basic Information</h3>

      {/* IMAGE PREVIEW */}
      {(preview || existingPhoto) && (
        <div className={styles.imageWrapper}>
          <img
            className={styles.imagePreview}
            src={preview || existingPhoto}
            alt="Profile"
          />
          {uploading && <div className={styles.imageOverlay}>Uploading…</div>}
        </div>
      )}

      {/* FILE INPUT */}
      <label className={styles.label}>
        {existingPhoto ? "Change Profile Photo" : "Profile Photo"}
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {/* FORM FIELDS */}
      <label className={styles.label}>Client Name *</label>
      <input placeholder="Client Name" {...register("clientName")} />
      <p>{errors.clientName?.message}</p>

      <label className={styles.label}>Owner Name</label>
      <input placeholder="Owner Name" {...register("ownerName")} />

      <label className={styles.label}>Email</label>
      <input placeholder="Email" {...register("email")} />

      <label className={styles.label}>Phone</label>
      <input placeholder="Phone" {...register("phone")} />

      <label className={styles.label}>Address</label>
      <textarea placeholder="Address" {...register("address")} />

      <label className={styles.label}>Onboarding Date</label>
      <input type="date" {...register("onboardingDate")} />
    </section>
  );
};

export default BasicInfoSection;
