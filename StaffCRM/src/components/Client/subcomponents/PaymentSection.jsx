import { useEffect } from "react";
import styles from "../CreateClient.module.css";

const PaymentSection = ({ register, watch, setValue, errors }) => {
  const billingType = watch("billingType");

  /* =========================================
     AUTO CLEANUP WHEN BILLING TYPE CHANGES
  ========================================= */
  useEffect(() => {
    if (billingType === "one-time") {
      setValue("monthlyAmount", "");
      setValue("tenure", "");
    }

    if (billingType === "monthly") {
      // totalAmount optional depending on your logic
      // keep it if you want total = monthlyAmount * tenure
    }
  }, [billingType, setValue]);

  const getInputClass = (field) =>
    `${styles.input} ${errors?.[field] ? styles.errorInput : ""}`;

  const getSelectClass = (field) =>
    `${styles.select} ${errors?.[field] ? styles.errorInput : ""}`;

  return (
    <section className={styles.section}>
      <h3 className={styles.h3}>Payment Details</h3>

      {/* BILLING TYPE */}
      <label className={styles.label}>Billing Type</label>
      <select
        className={getSelectClass("billingType")}
        {...register("billingType")}
      >
        <option value="one-time">One Time</option>
        <option value="monthly">Monthly</option>
      </select>
      {errors?.billingType && (
        <p className={styles.errorText}>{errors.billingType.message}</p>
      )}

      {/* PAYMENT STATUS */}
      <label className={styles.label}>Payment Status</label>
      <select
        className={getSelectClass("paymentStatus")}
        {...register("paymentStatus")}
      >
        <option value="pending">Pending</option>
        <option value="partial">Partial</option>
        <option value="paid">Paid</option>
      </select>
      {errors?.paymentStatus && (
        <p className={styles.errorText}>{errors.paymentStatus.message}</p>
      )}

      {/* ONE TIME */}
      {billingType === "one-time" && (
        <>
          <label className={styles.label}>Total Amount</label>
          <input
            type="number"
            step="0.01"
            placeholder="Total Amount"
            className={getInputClass("totalAmount")}
            {...register("totalAmount")}
          />
          {errors?.totalAmount && (
            <p className={styles.errorText}>{errors.totalAmount.message}</p>
          )}
        </>
      )}

      {/* MONTHLY */}
      {billingType === "monthly" && (
        <>
          <label className={styles.label}>Monthly Amount</label>
          <input
            type="number"
            step="0.01"
            placeholder="Monthly Amount"
            className={getInputClass("monthlyAmount")}
            {...register("monthlyAmount")}
          />
          {errors?.monthlyAmount && (
            <p className={styles.errorText}>{errors.monthlyAmount.message}</p>
          )}

          <label className={styles.label}>Tenure (months)</label>
          <input
            type="number"
            placeholder="No of Months"
            className={getInputClass("tenure")}
            {...register("tenure")}
          />
          {errors?.tenure && (
            <p className={styles.errorText}>{errors.tenure.message}</p>
          )}
        </>
      )}
    </section>
  );
};

export default PaymentSection;
