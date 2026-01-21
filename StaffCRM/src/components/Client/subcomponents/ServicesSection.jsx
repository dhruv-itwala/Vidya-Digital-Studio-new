import styles from "../CreateClient.module.css";
const ServicesSection = ({ register }) => {
  return (
    <section className={styles.section}>
      <h3 className={styles.h3}>Services</h3>
      <label className={styles.label}>Services (comma separated)</label>
      <input
        placeholder="SSM, Website, SEO"
        className={styles.input}
        {...register("servicesText")}
      />
    </section>
  );
};

export default ServicesSection;
