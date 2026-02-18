import { useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import styles from "../CreateClient.module.css";

const DocumentsTable = ({
  control,
  register,
  errors,
  existingDocuments = [],
  onDeleteExisting,
  loading,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "documents",
  });

  /* AUTO ADD FIRST ROW */
  useEffect(() => {
    if (fields.length === 0 && existingDocuments.length === 0) {
      append({ file: null });
    }
  }, [fields.length, existingDocuments.length, append]);

  const getError = (index) => errors?.documents?.[index]?.file;

  const getInputClass = (index) =>
    `${styles.input} ${getError(index) ? styles.errorInput : ""}`;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.h3}>Documents</h3>

        <button
          type="button"
          className={styles.btn}
          onClick={() => append({ file: null })}
        >
          + Add Document
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>File</th>
              <th className={styles.tableHeader}>Preview</th>
              <th className={styles.tableHeader}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {/* EXISTING DOCUMENTS */}
            {existingDocuments.map((doc) => (
              <tr key={doc._id} className={styles.tr}>
                <td>{doc.name}</td>

                <td>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.link}
                  >
                    View
                  </a>
                </td>

                <td>
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => onDeleteExisting?.(doc._id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {/* NEW DOCUMENTS */}
            {fields.map((doc, i) => (
              <tr key={doc.id} className={styles.tr}>
                <td>
                  <input
                    type="file"
                    className={getInputClass(i)}
                    {...register(`documents.${i}.file`)}
                  />
                  {getError(i) && (
                    <p className={styles.errorText}>{getError(i)?.message}</p>
                  )}
                </td>

                <td>
                  {doc.file?.[0] && (
                    <span className={styles.link}>Selected</span>
                  )}
                </td>

                <td>
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => remove(i)}
                  >
                    Remove
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

export default DocumentsTable;
