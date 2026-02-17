import { useFieldArray } from "react-hook-form";
import styles from "../CreateClient.module.css";

const DocumentsTable = ({ control, register, errors }) => {
  const { fields, append, update } = useFieldArray({
    control,
    name: "documents",
  });

  const getError = (index, field) => errors?.documents?.[index]?.[field];

  const getInputClass = (index, field) =>
    `${styles.input} ${getError(index, field) ? styles.errorInput : ""}`;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.h3}>Documents</h3>

        <button
          type="button"
          className={styles.btn}
          onClick={() =>
            append({
              name: "",
              file: null,
              removed: false,
            })
          }
        >
          + Add Document
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>Name</th>
              <th className={styles.tableHeader}>File</th>
              <th className={styles.tableHeader}>Preview</th>
              <th className={styles.tableHeader}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {fields.map((doc, i) => {
              if (doc.removed) return null;

              return (
                <tr key={doc.id} className={styles.tr}>
                  {/* NAME */}
                  <td>
                    <input
                      placeholder="File name"
                      className={getInputClass(i, "name")}
                      {...register(`documents.${i}.name`)}
                    />
                    {getError(i, "name") && (
                      <p className={styles.errorText}>
                        {getError(i, "name")?.message}
                      </p>
                    )}
                  </td>

                  {/* FILE */}
                  <td>
                    <input
                      type="file"
                      className={getInputClass(i, "file")}
                      {...register(`documents.${i}.file`)}
                    />
                    {getError(i, "file") && (
                      <p className={styles.errorText}>
                        {getError(i, "file")?.message}
                      </p>
                    )}
                  </td>

                  {/* PREVIEW */}
                  <td>
                    {doc?.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.link}
                      >
                        View
                      </a>
                    )}
                  </td>

                  {/* DELETE */}
                  <td>
                    <button
                      type="button"
                      className={styles.danger}
                      onClick={() => update(i, { ...doc, removed: true })}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default DocumentsTable;
