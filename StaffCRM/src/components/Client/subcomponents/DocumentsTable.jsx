import { useFieldArray } from "react-hook-form";
import styles from "../CreateClient.module.css";

const DocumentsTable = ({ control, register }) => {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "documents",
  });

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
              existing: false,
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
                      className={styles.input}
                      placeholder="File name"
                      {...register(`documents.${i}.name`)}
                    />
                  </td>

                  {/* FILE (REPLACE) */}
                  <td>
                    <input
                      type="file"
                      className={styles.input}
                      {...register(`documents.${i}.file`)}
                    />
                  </td>

                  {/* PREVIEW */}
                  <td>
                    {doc.url && (
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

                  {/* ACTIONS */}
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
