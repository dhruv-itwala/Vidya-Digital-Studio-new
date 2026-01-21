import { useFieldArray } from "react-hook-form";
import styles from "../CreateClient.module.css";
const TransactionsTable = ({ control, register }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "transactions",
  });

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
            {fields.map((_, i) => (
              <tr key={i} className={styles.tr}>
                <td>
                  <input
                    type="date"
                    className={styles.input}
                    {...register(`transactions.${i}.date`)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    placeholder="Enter Amount"
                    className={styles.input}
                    {...register(`transactions.${i}.amount`)}
                  />
                </td>
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
