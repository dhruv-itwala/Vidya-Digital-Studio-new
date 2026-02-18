import { useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import styles from "../CreateClient.module.css";

const CredentialsTable = ({ control, register, errors }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "credentials",
  });

  /* =========================================
     AUTO ADD ONE EMPTY ROW IF NONE
     (Optional but nice UX)
  ========================================= */
  useEffect(() => {
    if (fields.length === 0) {
      append({
        platform: "",
        username: "",
        password: "",
        note: "",
      });
    }
  }, [fields.length, append]);

  const getError = (index, field) => errors?.credentials?.[index]?.[field];

  const getInputClass = (index, field) =>
    `${styles.input} ${getError(index, field) ? styles.errorInput : ""}`;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.h3}>Credentials</h3>

        <button
          type="button"
          className={styles.btn}
          onClick={() =>
            append({
              platform: "",
              username: "",
              password: "",
              note: "",
            })
          }
        >
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
            {fields.map((field, i) => (
              <tr key={field.id} className={styles.tr}>
                {/* PLATFORM */}
                <td>
                  <input
                    placeholder="Platform"
                    className={getInputClass(i, "platform")}
                    {...register(`credentials.${i}.platform`)}
                  />
                  {getError(i, "platform") && (
                    <p className={styles.errorText}>
                      {getError(i, "platform")?.message}
                    </p>
                  )}
                </td>

                {/* USERNAME */}
                <td>
                  <input
                    placeholder="Username"
                    className={getInputClass(i, "username")}
                    {...register(`credentials.${i}.username`)}
                  />
                  {getError(i, "username") && (
                    <p className={styles.errorText}>
                      {getError(i, "username")?.message}
                    </p>
                  )}
                </td>

                {/* PASSWORD */}
                <td>
                  <input
                    type="text"
                    placeholder="Password"
                    className={getInputClass(i, "password")}
                    {...register(`credentials.${i}.password`)}
                  />
                  {getError(i, "password") && (
                    <p className={styles.errorText}>
                      {getError(i, "password")?.message}
                    </p>
                  )}
                </td>

                {/* NOTE */}
                <td>
                  <input
                    placeholder="Note"
                    className={getInputClass(i, "note")}
                    {...register(`credentials.${i}.note`)}
                  />
                  {getError(i, "note") && (
                    <p className={styles.errorText}>
                      {getError(i, "note")?.message}
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

export default CredentialsTable;
