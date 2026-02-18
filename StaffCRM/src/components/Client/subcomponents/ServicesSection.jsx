import { useEffect } from "react";
import styles from "../CreateClient.module.css";

const ServicesSection = ({
  register,
  errors,
  existingServices = [], // pass client?.services in edit mode
  setValue,
}) => {
  const hasError = errors?.servicesText;

  /* =========================================
     PREFILL FOR EDIT MODE
  ========================================= */
  useEffect(() => {
    if (existingServices?.length) {
      setValue("servicesText", existingServices.join(", "));
    }
  }, [existingServices, setValue]);

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
