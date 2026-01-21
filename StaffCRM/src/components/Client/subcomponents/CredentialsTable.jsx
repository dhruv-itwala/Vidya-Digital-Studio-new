import { useFieldArray } from "react-hook-form";
import styles from "../CreateClient.module.css";
const CredentialsTable = ({ control, register }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "credentials",
  });

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.h3}>Credentials</h3>
        <button type="button" className={styles.btn} onClick={() => append({})}>
          + Add Credential
        </button>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>Platform</th>
              <th className={styles.tableHeader}>Username</th>
              <th className={styles.tableHeader}>Password</th>
              <th className={styles.tableHeader}>Note</th>
              <th className={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((_, i) => (
              <tr key={i} className={styles.tr}>
                <td>
                  <input
                    placeholder="Platform"
                    className={styles.input}
                    {...register(`credentials.${i}.platform`)}
                  />
                </td>
                <td>
                  <input
                    placeholder="Username"
                    className={styles.input}
                    {...register(`credentials.${i}.username`)}
                  />
                </td>
                <td>
                  <input
                    placeholder="Password"
                    className={styles.input}
                    {...register(`credentials.${i}.password`)}
                  />
                </td>
                <td>
                  <input
                    placeholder="Note"
                    className={styles.input}
                    {...register(`credentials.${i}.note`)}
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

export default CredentialsTable;
