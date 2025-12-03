import React from "react";
import { useFormContext } from "react-hook-form";
import styles from "../QuoteUserBuilderForm.module.css";

const Step1Client = ({ onNext }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className={styles.stepCard}>
      <h2 className={styles.title}>Let’s start with your details</h2>
      <p className={styles.subTitle}>
        We’ll use this information in your quotation and emails.
      </p>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>Name *</label>
          <input
            className={`${styles.input} ${
              errors.name ? styles.inputError : ""
            }`}
            placeholder="Your full name"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className={styles.errorText}>{errors.name.message}</p>
          )}
        </div>

        <div className={styles.field}>
          <label>Email *</label>
          <input
            className={`${styles.input} ${
              errors.email ? styles.inputError : ""
            }`}
            placeholder="you@example.com"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email format",
              },
            })}
          />
          {errors.email && (
            <p className={styles.errorText}>{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className={styles.navRow}>
        <button className={styles.primaryBtn} type="button" onClick={onNext}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default Step1Client;
