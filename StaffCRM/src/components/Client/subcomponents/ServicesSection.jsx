import styles from "../CreateClient.module.css";

const ServicesSection = ({ register, errors }) => {
  const hasError = errors?.servicesText;

  return (
    <section className={styles.section}>
      <h3 className={styles.h3}>Services</h3>

      <label className={styles.label}>Services (comma separated)</label>

      <input
        placeholder="SSM, Website, SEO"
        className={`${styles.input} ${hasError ? styles.errorInput : ""}`}
        {...register("servicesText")}
      />

      {hasError && (
        <p className={styles.errorText}>{errors.servicesText.message}</p>
      )}
    </section>
  );
};

export default ServicesSection;
