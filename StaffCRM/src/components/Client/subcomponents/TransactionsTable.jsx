import { useFieldArray } from "react-hook-form";
import styles from "../CreateClient.module.css";

const TransactionsTable = ({ control, register, errors }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "transactions",
  });

  const getError = (index, field) => errors?.transactions?.[index]?.[field];

  const getInputClass = (index, field) =>
    `${styles.input} ${getError(index, field) ? styles.errorInput : ""}`;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.h3}>Transaction History</h3>
        <button
          type="button"
          className={styles.btn}
          onClick={() => append({ date: "", amount: "" })}
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
            {fields.map((field, i) => (
              <tr key={field.id} className={styles.tr}>
                {/* DATE */}
                <td>
                  <input
                    type="date"
                    className={getInputClass(i, "date")}
                    {...register(`transactions.${i}.date`)}
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
                    placeholder="Enter Amount"
                    className={getInputClass(i, "amount")}
                    {...register(`transactions.${i}.amount`)}
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
