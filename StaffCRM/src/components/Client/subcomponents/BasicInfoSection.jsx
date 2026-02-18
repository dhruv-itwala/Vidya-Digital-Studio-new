import { useEffect, useState } from "react";
import styles from "../CreateClient.module.css";

const BasicInfoSection = ({
  register,
  errors,
  existingPhoto, // pass client?.profilePhoto?.url in edit mode
}) => {
  const [preview, setPreview] = useState(null);

  /* =========================================
     HANDLE FILE CHANGE
  ========================================= */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
  };

  /* =========================================
     CLEANUP PREVIEW (IMPORTANT)
  ========================================= */
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const getInputClass = (field) =>
    `${styles.input} ${errors?.[field] ? styles.errorInput : ""}`;

  return (
    <section className={styles.section}>
      <h3 className={styles.h3}>Basic Information</h3>

      {/* IMAGE PREVIEW */}
      {(preview || existingPhoto?.url) && (
        <div className={styles.imageWrapper}>
          <img
            className={styles.imagePreview}
            src={preview || existingPhoto?.url}
            alt="Profile"
          />
        </div>
      )}

      {/* PROFILE PHOTO */}
      <label className={styles.label}>
        {existingPhoto ? "Change Profile Photo" : "Profile Photo"}
      </label>

      <input
        type="file"
        accept="image/*"
        {...register("profilePhoto")}
        onChange={handleFileChange}
      />

      {/* CLIENT NAME */}
      <label className={styles.label}>Client Name *</label>
      <input
        placeholder="Client Name"
        className={getInputClass("clientName")}
        {...register("clientName")}
      />
      {errors?.clientName && (
        <p className={styles.errorText}>{errors.clientName.message}</p>
      )}

      {/* OWNER NAME */}
      <label className={styles.label}>Owner Name</label>
      <input
        placeholder="Owner Name"
        className={getInputClass("ownerName")}
        {...register("ownerName")}
      />
      {errors?.ownerName && (
        <p className={styles.errorText}>{errors.ownerName.message}</p>
      )}

      {/* EMAIL */}
      <label className={styles.label}>Email</label>
      <input
        type="email"
        placeholder="Email"
        className={getInputClass("email")}
        {...register("email")}
      />
      {errors?.email && (
        <p className={styles.errorText}>{errors.email.message}</p>
      )}

      {/* PHONE */}
      <label className={styles.label}>Phone</label>
      <input
        placeholder="Phone"
        className={getInputClass("phone")}
        {...register("phone")}
      />
      {errors?.phone && (
        <p className={styles.errorText}>{errors.phone.message}</p>
      )}

      {/* ADDRESS */}
      <label className={styles.label}>Address</label>
      <textarea
        placeholder="Address"
        className={`${styles.textarea} ${
          errors?.address ? styles.errorInput : ""
        }`}
        {...register("address")}
      />
      {errors?.address && (
        <p className={styles.errorText}>{errors.address.message}</p>
      )}

      {/* ONBOARDING DATE */}
      <label className={styles.label}>Onboarding Date</label>
      <input
        type="date"
        className={getInputClass("onboardingDate")}
        {...register("onboardingDate")}
      />
      {errors?.onboardingDate && (
        <p className={styles.errorText}>{errors.onboardingDate.message}</p>
      )}
    </section>
  );
};

export default BasicInfoSection;
