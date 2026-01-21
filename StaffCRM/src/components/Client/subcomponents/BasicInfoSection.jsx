import styles from "../CreateClient.module.css";
const BasicInfoSection = ({ register, errors, existingPhoto }) => {
  return (
    <section className={styles.section}>
      <h3 className={styles.h3}>Basic Information</h3>
      {existingPhoto && (
        <div>
          <img
            className={styles.imagePreview}
            src={existingPhoto}
            alt="Profile"
          />
        </div>
      )}

      <label className={styles.label}>
        {existingPhoto ? "Change Profile Photo" : "Profile Photo"}
      </label>
      <input type="file" accept="image/*" {...register("profilePhoto")} />

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
