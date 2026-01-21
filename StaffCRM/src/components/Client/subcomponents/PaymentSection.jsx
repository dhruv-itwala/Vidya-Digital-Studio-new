import styles from "../CreateClient.module.css";
const PaymentSection = ({ register, watch }) => {
  const billingType = watch("billingType");

  return (
    <section className={styles.section}>
      <h3 className={styles.h3}>Payment Details</h3>

      <label className={styles.label}>Billing Type</label>
      <select className={styles.select} {...register("billingType")}>
        <option value="one-time">One Time</option>
        <option value="monthly">Monthly</option>
      </select>

      <label className={styles.label}>Payment Status</label>
      <select className={styles.select} {...register("paymentStatus")}>
        <option value="pending">Pending</option>
        <option value="partial">Partial</option>
        <option value="paid">Paid</option>
      </select>

      {billingType === "one-time" && (
        <>
          <label className={styles.label}>Total Amount</label>
          <input
            type="number"
            className={styles.input}
            placeholder="Total Amount"
            {...register("totalAmount")}
          />
        </>
      )}

      {billingType === "monthly" && (
        <>
          <label className={styles.label}>Total Amount</label>
          <input
            type="number"
            className={styles.input}
            placeholder="Total Amount"
            {...register("totalAmount")}
          />

          <label className={styles.label}>Monthly Amount</label>
          <input
            type="number"
            placeholder="Monthly Amount"
            className={styles.input}
            {...register("monthlyAmount")}
          />

          <label className={styles.label}>Tenure (months)</label>
          <input
            type="number"
            placeholder="No of Months"
            className={styles.input}
            {...register("tenure")}
          />
        </>
      )}
    </section>
  );
};

export default PaymentSection;
