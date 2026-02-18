import { useFieldArray } from "react-hook-form";
import styles from "../CreateClient.module.css";

const TransactionsTable = ({ control, register, errors, watch, setValue }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "transactions",
  });

  const paymentStatus = watch?.("paymentStatus");

  /* =========================================
     CLEAR TRANSACTIONS IF PAYMENT IS PENDING
  ========================================= */
  if (paymentStatus === "pending" && fields.length > 0) {
    setValue("transactions", []);
  }

  const getError = (index, field) => errors?.transactions?.[index]?.[field];

  const getInputClass = (index, field) =>
    `${styles.input} ${getError(index, field) ? styles.errorInput : ""}`;

  const isDisabled = paymentStatus === "pending";

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.h3}>Transaction History</h3>

        <button
          type="button"
          className={styles.btn}
          onClick={() => append({ date: "", amount: "" })}
          disabled={isDisabled}
        >
          + Add Transaction
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>Date</th>
              <th className={styles.tableHeader}>Amount</th>
              <th className={styles.tableHeader}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {fields.length === 0 && (
              <tr>
                <td colSpan="3" className={styles.empty}>
                  {isDisabled
                    ? "Payment is pending — no transactions yet"
                    : "No transactions added"}
                </td>
              </tr>
            )}

            {fields.map((field, i) => (
              <tr key={field.id} className={styles.tr}>
                {/* DATE */}
                <td>
                  <input
                    type="date"
                    className={getInputClass(i, "date")}
                    {...register(`transactions.${i}.date`)}
                    disabled={isDisabled}
                  />
                  {getError(i, "date") && (
                    <p className={styles.errorText}>
                      {getError(i, "date")?.message}
                    </p>
                  )}
                </td>

                {/* AMOUNT */}
                <td>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter Amount"
                    className={getInputClass(i, "amount")}
                    {...register(`transactions.${i}.amount`)}
                    disabled={isDisabled}
                  />
                  {getError(i, "amount") && (
                    <p className={styles.errorText}>
                      {getError(i, "amount")?.message}
                    </p>
                  )}
                </td>

                {/* DELETE */}
                <td>
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => remove(i)}
                    disabled={isDisabled}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TransactionsTable;
