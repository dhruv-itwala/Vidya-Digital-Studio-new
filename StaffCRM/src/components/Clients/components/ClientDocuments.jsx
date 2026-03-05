import { useState } from "react";
import styles from "../ClientForm.module.css";
import toast from "react-hot-toast";
import { formatFileSize } from "../../../utils/time.util";

export default function ClientDocuments({
  form,
  setForm,
  readOnly,
  isCreate,
  uploadDocument,
  deleteDocument,
}) {
  const [loadingIndex, setLoadingIndex] = useState(null);

  const handleAddRow = () => {
    setForm((prev) => ({
      ...prev,
      documents: [...prev.documents, { file: null, isNew: true }],
    }));
  };

  const handleCancel = (index) => {
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const handleUpload = async (doc, index) => {
    if (!doc.file) return toast.error("Select file");

    try {
      setLoadingIndex(index);

      const res = await uploadDocument(form._id, doc.file);

      if (!res.success) throw new Error(res.message);

      toast.success("Uploaded");

      setForm(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingIndex(null);
    }
  };

  const handleDelete = async (doc) => {
    try {
      setLoadingIndex(doc._id);

      const res = await deleteDocument(form._id, doc.public_id);

      if (!res.success) throw new Error(res.message);

      toast.success("Deleted");

      setForm(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingIndex(null);
    }
  };

  const normalDate = (date) => {
    return new Date(date).toLocaleDateString("en-CA");
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3>Documents</h3>

        {!readOnly && !isCreate && (
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleAddRow}
          >
            + Add Document
          </button>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>File</th>
              <th>Size</th>
              <th>Uploaded on</th>
              {!readOnly && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {form.documents.length === 0 && (
              <tr>
                <td colSpan="4" className={styles.empty}>
                  No documents added
                </td>
              </tr>
            )}

            {form.documents.map((doc, index) => (
              <tr key={doc._id || index}>
                {/* FILE */}
                <td>
                  {doc.isNew ? (
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        const updated = [...form.documents];
                        updated[index].file = file;
                        updated[index].name = file.name; // auto set name

                        setForm((prev) => ({
                          ...prev,
                          documents: updated,
                        }));
                      }}
                    />
                  ) : (
                    <a href={doc.url} target="_blank" rel="noreferrer">
                      {doc.name}
                    </a>
                  )}
                </td>

                {/* SIZE */}
                <td>{doc.size ? `${formatFileSize(doc.size)}` : "N/A"}</td>

                {/* UPLOADED ON */}
                <td>{doc.uploadedAt ? normalDate(doc.uploadedAt) : "N/A"}</td>

                {/* ACTIONS */}
                {!readOnly && (
                  <td>
                    {doc.isNew ? (
                      <>
                        <button
                          className={styles.primaryBtn}
                          disabled={loadingIndex === index}
                          onClick={() => handleUpload(doc, index)}
                        >
                          {loadingIndex === index ? "Uploading..." : "Save"}
                        </button>

                        <button
                          type="button"
                          className={styles.cancelBtn}
                          onClick={() => handleCancel(index)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(doc)}
                      >
                        {loadingIndex === doc._id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
